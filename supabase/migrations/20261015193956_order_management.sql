-- Phase 5: admin order management — status history, notifications, audit
-- log, and the SECURITY DEFINER functions that are the only way an
-- order's status ever changes after creation.
--
-- Scope note: accept_order here transitions pending -> accepted and
-- records who/when, but does NOT touch products.stock_weight_g yet.
-- Atomic stock deduction, the two-admins-race concurrency guarantee, and
-- inventory_movements land in Phase 6 (spec section 24 splits these
-- across Phase 5 "acceptance, rejection, status history, notifications"
-- vs Phase 6 "atomic inventory deduction at acceptance" explicitly) —
-- accept_order is extended in place there, not replaced.

-- ---------------------------------------------------------------------------
-- order_status_history
-- ---------------------------------------------------------------------------

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  previous_status text,
  new_status text not null,
  changed_by uuid references auth.users (id),
  reason text,
  created_at timestamptz not null default now()
);

create index order_status_history_order_id_idx on public.order_status_history (order_id);

alter table public.order_status_history enable row level security;

create policy "order_status_history_select_own_or_admin"
on public.order_status_history for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_status_history.order_id
      and (o.user_id = (select auth.uid()) or (select private.is_admin()))
  )
);

-- No insert/update/delete policy: written only by the functions below.
grant select on public.order_status_history to authenticated;

-- ---------------------------------------------------------------------------
-- admin_audit_logs — admin-only, written only by the functions below.
-- ---------------------------------------------------------------------------

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_admin_user_id_idx on public.admin_audit_logs (admin_user_id);
create index admin_audit_logs_entity_idx on public.admin_audit_logs (entity_type, entity_id);

alter table public.admin_audit_logs enable row level security;

create policy "admin_audit_logs_select_admin"
on public.admin_audit_logs for select
to authenticated
using ((select private.is_admin()));

grant select on public.admin_audit_logs to authenticated;

-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  related_order_id uuid references public.orders (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);

alter table public.notifications enable row level security;

create policy "notifications_select_own"
on public.notifications for select
to authenticated
using ((select auth.uid()) = user_id);

-- Only the owner can mark their own notification read — never create or
-- delete one, and never change anything but its own row.
create policy "notifications_update_own"
on public.notifications for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, update on public.notifications to authenticated;

create or replace function private.notify_user(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_order_id uuid default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, type, title, message, related_order_id)
  values (p_user_id, p_type, p_title, p_message, p_order_id);
$$;

revoke execute on function private.notify_user(uuid, text, text, text, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- private.require_admin() — the explicit, in-function admin check every
-- admin-only SECURITY DEFINER function below calls first. RLS does not
-- apply inside a SECURITY DEFINER function body (it runs as the owner),
-- so this check is what actually stops a non-admin from calling one of
-- these functions and having it do anything.
-- ---------------------------------------------------------------------------

create or replace function private.require_admin()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or not (select private.is_admin()) then
    raise exception 'Admin privileges required' using errcode = '42501';
  end if;
  return v_uid;
end;
$$;

revoke execute on function private.require_admin() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- public.accept_order
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
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = '22023';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Order is not pending (current status: %)', v_order.status using errcode = '22023';
  end if;

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
-- public.reject_order
-- ---------------------------------------------------------------------------

create or replace function public.reject_order(p_order_id uuid, p_reason text)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select private.require_admin());
  v_order public.orders;
begin
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A rejection reason is required' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = '22023';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Order is not pending (current status: %)', v_order.status using errcode = '22023';
  end if;

  update public.orders
  set status = 'rejected', rejection_reason = p_reason
  where id = p_order_id
  returning * into v_order;

  insert into public.order_status_history (order_id, previous_status, new_status, changed_by, reason)
  values (p_order_id, 'pending', 'rejected', v_admin_id, p_reason);

  insert into public.admin_audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
  values (v_admin_id, 'reject_order', 'order', p_order_id, jsonb_build_object('reason', p_reason));

  perform private.notify_user(
    v_order.user_id, 'order_rejected', 'Order rejected',
    'Your order ' || v_order.order_number || ' was rejected: ' || p_reason,
    p_order_id
  );

  return v_order;
end;
$$;

revoke execute on function public.reject_order(uuid, text) from public, anon;
grant execute on function public.reject_order(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- public.update_order_status — forward-only fulfilment progression.
-- Acceptance/rejection are handled by the dedicated functions above, not
-- this one (status 'pending' is never a valid target or source here).
-- ---------------------------------------------------------------------------

create or replace function public.update_order_status(p_order_id uuid, p_new_status text)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select private.require_admin());
  v_order public.orders;
  v_valid_next text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = '22023';
  end if;

  v_valid_next := case v_order.status
    when 'accepted' then 'preparing'
    when 'preparing' then 'ready_for_dispatch'
    when 'ready_for_dispatch' then 'out_for_delivery'
    when 'out_for_delivery' then 'delivered'
    else null
  end;

  if v_valid_next is null or p_new_status <> v_valid_next then
    raise exception 'Cannot move order from % to %', v_order.status, p_new_status
      using errcode = '22023';
  end if;

  update public.orders set status = p_new_status where id = p_order_id returning * into v_order;

  insert into public.order_status_history (order_id, previous_status, new_status, changed_by)
  values (p_order_id, v_order.status, p_new_status, v_admin_id);

  insert into public.admin_audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
  values (v_admin_id, 'update_order_status', 'order', p_order_id, jsonb_build_object('new_status', p_new_status));

  perform private.notify_user(
    v_order.user_id, 'order_status_changed', 'Order update',
    'Your order ' || v_order.order_number || ' is now: ' || p_new_status,
    p_order_id
  );

  return v_order;
end;
$$;

revoke execute on function public.update_order_status(uuid, text) from public, anon;
grant execute on function public.update_order_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- public.cancel_order — customer-initiated, only while still pending
-- (spec section 11: "A customer may cancel a pending order if the
-- business rules permit it"). No stock implications since pending orders
-- never deduct stock. Admin-initiated cancellation of an already-accepted
-- order (which does need stock restoration) lands in Phase 6/7.
-- ---------------------------------------------------------------------------

create or replace function public.cancel_order(p_order_id uuid, p_reason text default null)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_order public.orders;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.user_id <> v_uid then
    raise exception 'Order not found' using errcode = '22023';
  end if;
  if v_order.status <> 'pending' then
    raise exception 'Only a pending order can be cancelled' using errcode = '22023';
  end if;

  update public.orders set status = 'cancelled' where id = p_order_id returning * into v_order;

  insert into public.order_status_history (order_id, previous_status, new_status, changed_by, reason)
  values (p_order_id, 'pending', 'cancelled', v_uid, p_reason);

  return v_order;
end;
$$;

revoke execute on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Re-point create_order (Phase 4) to also send the "order placed"
-- notification (spec section 21) now that private.notify_user exists.
-- Identical to the original body except for the final `perform` call.
-- ---------------------------------------------------------------------------

create or replace function public.create_order(
  p_address_id uuid,
  p_payment_method text,
  p_idempotency_key text,
  p_customer_notes text default null
)
returns public.orders
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_cart_id uuid;
  v_address jsonb;
  v_subtotal_paise bigint := 0;
  v_settings public.store_settings;
  v_tax_paise bigint;
  v_delivery_fee_paise bigint;
  v_total_paise bigint;
  v_order public.orders;
  v_item record;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  if p_payment_method not in ('razorpay', 'cod') then
    raise exception 'Invalid payment method' using errcode = '22023';
  end if;

  select * into v_order
  from public.orders
  where user_id = v_user_id and idempotency_key = p_idempotency_key;
  if found then
    return v_order;
  end if;

  select to_jsonb(a) - 'user_id' into v_address
  from public.addresses a
  where a.id = p_address_id and a.user_id = v_user_id;
  if v_address is null then
    raise exception 'Address not found' using errcode = '22023';
  end if;

  select id into v_cart_id from public.carts where user_id = v_user_id;
  if v_cart_id is null then
    raise exception 'Cart is empty' using errcode = '22023';
  end if;

  select * into v_settings from public.store_settings where id = true;

  for v_item in
    select ci.id as cart_item_id, ci.product_id, ci.quantity_g,
           p.name, p.sku, p.price_per_kg_paise, p.min_order_weight_g,
           p.max_order_weight_g, p.weight_increment_g, p.is_active
    from public.cart_items ci
    join public.products p on p.id = ci.product_id
    where ci.cart_id = v_cart_id
    order by p.id
    for update of p
  loop
    if not v_item.is_active then
      raise exception 'Product % is no longer available', v_item.name using errcode = '22023';
    end if;
    if v_item.quantity_g < v_item.min_order_weight_g
      or (v_item.max_order_weight_g is not null and v_item.quantity_g > v_item.max_order_weight_g)
      or (v_item.quantity_g - v_item.min_order_weight_g) % v_item.weight_increment_g <> 0
    then
      raise exception 'Invalid quantity for %', v_item.name using errcode = '22023';
    end if;

    v_subtotal_paise := v_subtotal_paise + round(v_item.price_per_kg_paise * v_item.quantity_g / 1000.0);
  end loop;

  if v_subtotal_paise = 0 then
    raise exception 'Cart is empty' using errcode = '22023';
  end if;
  if v_subtotal_paise < v_settings.min_order_value_paise then
    raise exception 'Order does not meet the minimum order value' using errcode = '22023';
  end if;
  if p_payment_method = 'cod' and not v_settings.cod_enabled then
    raise exception 'Cash on Delivery is not currently available' using errcode = '22023';
  end if;
  if p_payment_method = 'razorpay' and not v_settings.online_payment_enabled then
    raise exception 'Online payment is not currently available' using errcode = '22023';
  end if;

  v_tax_paise := round(v_subtotal_paise * v_settings.tax_rate_bps / 10000.0);
  v_delivery_fee_paise := v_settings.delivery_fee_paise;
  if v_settings.free_delivery_min_order_paise is not null
     and v_subtotal_paise >= v_settings.free_delivery_min_order_paise then
    v_delivery_fee_paise := 0;
  end if;
  v_total_paise := v_subtotal_paise + v_tax_paise + v_delivery_fee_paise;

  begin
    insert into public.orders (
      order_number, user_id, address_snapshot, payment_method,
      subtotal_paise, tax_paise, delivery_fee_paise, total_paise,
      idempotency_key, customer_notes
    ) values (
      'LN-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0'),
      v_user_id, v_address, p_payment_method,
      v_subtotal_paise, v_tax_paise, v_delivery_fee_paise, v_total_paise,
      p_idempotency_key, p_customer_notes
    )
    returning * into v_order;
  exception when unique_violation then
    select * into v_order
    from public.orders
    where user_id = v_user_id and idempotency_key = p_idempotency_key;
    return v_order;
  end;

  insert into public.order_items (
    order_id, product_id, product_name_snapshot, sku_snapshot,
    unit_price_per_kg_paise, quantity_g, subtotal_paise
  )
  select v_order.id, ci.product_id, p.name, p.sku, p.price_per_kg_paise, ci.quantity_g,
         round(p.price_per_kg_paise * ci.quantity_g / 1000.0)
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.cart_id = v_cart_id;

  delete from public.cart_items where cart_id = v_cart_id;

  perform private.notify_user(
    v_user_id, 'order_placed', 'Order placed',
    'Your order ' || v_order.order_number || ' has been placed.',
    v_order.id
  );

  return v_order;
end;
$$;

revoke execute on function public.create_order(uuid, text, text, text) from public, anon;
grant execute on function public.create_order(uuid, text, text, text) to authenticated;
