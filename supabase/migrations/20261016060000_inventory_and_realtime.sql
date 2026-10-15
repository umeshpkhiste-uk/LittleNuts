-- Phase 6: atomic inventory deduction at acceptance, stock adjustments,
-- inventory movement history, concurrency protection, low-stock alerts,
-- and Realtime subscriptions (spec section 24, Phase 6).
--
-- Low-stock/out-of-stock alerting already exists via
-- get_admin_dashboard_summary (Phase 5); this migration adds the actual
-- inventory ledger and makes accept_order deduct stock atomically, as the
-- Phase 5 migration's own comment said it would.

-- ---------------------------------------------------------------------------
-- inventory_movements — audit trail for every stock change, whatever the
-- cause. Written only by the functions below, never directly by clients.
-- ---------------------------------------------------------------------------

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  change_g integer not null check (change_g <> 0),
  reason text not null,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now()
);

create index inventory_movements_product_id_idx on public.inventory_movements (product_id);
create index inventory_movements_order_id_idx on public.inventory_movements (order_id);

alter table public.inventory_movements enable row level security;

create policy "inventory_movements_select_admin"
on public.inventory_movements for select
to authenticated
using ((select private.is_admin()));

grant select on public.inventory_movements to authenticated;

-- ---------------------------------------------------------------------------
-- accept_order — extended in place to atomically deduct stock. Locks every
-- product this order touches (ordered by product id, matching
-- create_order's lock order, to avoid deadlocking against a concurrent
-- create_order on a different order) and fails the whole acceptance if any
-- item is short. This is also what stops two admins from double-accepting
-- different orders that both need more of a product than remains: whichever
-- accept_order call reaches the product row second will see the
-- already-decremented stock_weight_g and correctly fail.
-- ---------------------------------------------------------------------------

create or replace function public.accept_order(p_order_id uuid)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select private.require_admin());
  v_order public.orders;
  v_item record;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = '22023';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Order is not pending (current status: %)', v_order.status using errcode = '22023';
  end if;

  for v_item in
    select oi.product_id, oi.quantity_g, oi.product_name_snapshot, p.stock_weight_g
    from public.order_items oi
    join public.products p on p.id = oi.product_id
    where oi.order_id = p_order_id
    order by oi.product_id
    for update of p
  loop
    if v_item.stock_weight_g < v_item.quantity_g then
      raise exception 'Insufficient stock for %: have %g, need %g',
        v_item.product_name_snapshot, v_item.stock_weight_g, v_item.quantity_g
        using errcode = '22023';
    end if;
  end loop;

  update public.products p
  set stock_weight_g = p.stock_weight_g - oi.quantity_g
  from public.order_items oi
  where oi.order_id = p_order_id and oi.product_id = p.id;

  insert into public.inventory_movements (product_id, order_id, change_g, reason, created_by)
  select oi.product_id, p_order_id, -oi.quantity_g, 'order_acceptance', v_admin_id
  from public.order_items oi
  where oi.order_id = p_order_id and oi.product_id is not null;

  update public.orders
  set status = 'accepted', accepted_by = v_admin_id, accepted_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (order_id, previous_status, new_status, changed_by)
  values (p_order_id, 'pending', 'accepted', v_admin_id);

  insert into public.admin_audit_logs (admin_user_id, action, entity_type, entity_id)
  values (v_admin_id, 'accept_order', 'order', p_order_id);

  perform private.notify_user(
    v_order.user_id, 'order_accepted', 'Order accepted',
    'Your order ' || v_order.order_number || ' has been accepted and is being prepared.',
    p_order_id
  );

  return v_order;
end;
$$;

revoke execute on function public.accept_order(uuid) from public, anon;
grant execute on function public.accept_order(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_cancel_order — admin-initiated cancellation of an order that has
-- already been accepted (and therefore already deducted stock), while it
-- is still early enough in fulfilment to restore that stock meaningfully.
-- Not allowed once out_for_delivery or delivered.
-- ---------------------------------------------------------------------------

create or replace function public.admin_cancel_order(p_order_id uuid, p_reason text)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select private.require_admin());
  v_order public.orders;
  v_previous_status text;
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A cancellation reason is required' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = '22023';
  end if;
  if v_order.status not in ('accepted', 'preparing', 'ready_for_dispatch') then
    raise exception 'Order cannot be cancelled from status %', v_order.status using errcode = '22023';
  end if;
  v_previous_status := v_order.status;

  perform p.id
  from public.products p
  join public.order_items oi on oi.product_id = p.id
  where oi.order_id = p_order_id
  order by p.id
  for update of p;

  update public.products p
  set stock_weight_g = p.stock_weight_g + oi.quantity_g
  from public.order_items oi
  where oi.order_id = p_order_id and oi.product_id = p.id;

  insert into public.inventory_movements (product_id, order_id, change_g, reason, created_by)
  select oi.product_id, p_order_id, oi.quantity_g, 'order_cancellation_restock', v_admin_id
  from public.order_items oi
  where oi.order_id = p_order_id and oi.product_id is not null;

  update public.orders
  set status = 'cancelled', rejection_reason = p_reason
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (order_id, previous_status, new_status, changed_by, reason)
  values (p_order_id, v_previous_status, 'cancelled', v_admin_id, p_reason);

  insert into public.admin_audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
  values (v_admin_id, 'admin_cancel_order', 'order', p_order_id, jsonb_build_object('reason', p_reason));

  perform private.notify_user(
    v_order.user_id, 'order_cancelled', 'Order cancelled',
    'Your order ' || v_order.order_number || ' was cancelled: ' || p_reason,
    p_order_id
  );

  return v_order;
end;
$$;

revoke execute on function public.admin_cancel_order(uuid, text) from public, anon;
grant execute on function public.admin_cancel_order(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- adjust_product_stock — the only sanctioned way to change
-- products.stock_weight_g outside of order acceptance/cancellation (e.g. a
-- new delivery arriving, or a correction after a physical stock count).
-- Replaces the previous raw `update products set stock_weight_g = ...` the
-- admin app issued directly, so every change is now reasoned and logged.
-- ---------------------------------------------------------------------------

create or replace function public.adjust_product_stock(
  p_product_id uuid,
  p_new_stock_weight_g integer,
  p_reason text
)
returns public.products
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select private.require_admin());
  v_product public.products;
  v_delta integer;
begin
  if p_new_stock_weight_g < 0 then
    raise exception 'Stock cannot be negative' using errcode = '22023';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A reason is required for a stock adjustment' using errcode = '22023';
  end if;

  select * into v_product from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Product not found' using errcode = '22023';
  end if;

  v_delta := p_new_stock_weight_g - v_product.stock_weight_g;
  if v_delta = 0 then
    return v_product;
  end if;

  update public.products set stock_weight_g = p_new_stock_weight_g where id = p_product_id
  returning * into v_product;

  insert into public.inventory_movements (product_id, change_g, reason, created_by)
  values (p_product_id, v_delta, p_reason, v_admin_id);

  insert into public.admin_audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
  values (
    v_admin_id, 'adjust_product_stock', 'product', p_product_id,
    jsonb_build_object('delta_g', v_delta, 'reason', p_reason)
  );

  return v_product;
end;
$$;

revoke execute on function public.adjust_product_stock(uuid, integer, text) from public, anon;
grant execute on function public.adjust_product_stock(uuid, integer, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime — publish orders, products, and notifications changes so both
-- admins (and, for notifications, the customer) see updates live without
-- polling. RLS on each table still applies to who receives which rows.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
