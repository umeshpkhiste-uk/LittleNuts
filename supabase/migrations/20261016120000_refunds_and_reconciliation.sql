-- Phase 7: refund tracking, payment reconciliation (COD collection
-- confirmation, deferred twice already — see Phase 5/6 notes), and a
-- couple of indexes the dashboard's date-range queries benefit from.

-- ---------------------------------------------------------------------------
-- refunds — one row per refund attempt against a paid online order.
-- Written by initiate_refund() below (status 'pending') and then only by
-- the razorpay-refund Edge Function / razorpay-webhook (service role,
-- bypasses RLS) as the refund actually progresses at Razorpay.
-- ---------------------------------------------------------------------------

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  payment_attempt_id uuid references public.payment_attempts (id),
  amount_paise bigint not null check (amount_paise > 0),
  reason text not null,
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'processed', 'failed')
  ),
  provider_refund_id text unique,
  initiated_by uuid not null references auth.users (id),
  failure_reason text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create index refunds_order_id_idx on public.refunds (order_id);

alter table public.refunds enable row level security;

create policy "refunds_select_own_or_admin"
on public.refunds for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = refunds.order_id
      and (o.user_id = (select auth.uid()) or (select private.is_admin()))
  )
);

-- No insert/update/delete policy: written only by initiate_refund() and
-- the service-role Edge Functions.
grant select on public.refunds to authenticated;

-- ---------------------------------------------------------------------------
-- initiate_refund — admin-only. Creates the refunds row and flips the
-- order to 'refund_pending' so the dashboard surfaces it immediately; the
-- actual Razorpay API call happens in the razorpay-refund Edge Function
-- (which needs the Razorpay secret, not available inside Postgres),
-- keyed off this row's id.
-- ---------------------------------------------------------------------------

create or replace function public.initiate_refund(
  p_order_id uuid,
  p_amount_paise bigint,
  p_reason text
)
returns public.refunds
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_id uuid := (select private.require_admin());
  v_order public.orders;
  v_attempt public.payment_attempts;
  v_already_refunded bigint;
  v_refund public.refunds;
begin
  if p_amount_paise <= 0 then
    raise exception 'Refund amount must be positive' using errcode = '22023';
  end if;
  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'A refund reason is required' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order not found' using errcode = '22023';
  end if;
  if v_order.payment_method <> 'razorpay' then
    raise exception 'Only online (Razorpay) payments can be refunded through this flow' using errcode = '22023';
  end if;
  if v_order.payment_status not in ('paid', 'partially_refunded', 'refund_pending') then
    raise exception 'Order is not in a refundable payment state (current: %)', v_order.payment_status
      using errcode = '22023';
  end if;

  select * into v_attempt
  from public.payment_attempts
  where order_id = p_order_id and status = 'paid'
  order by created_at desc
  limit 1;
  if not found then
    raise exception 'No successful payment attempt found for this order' using errcode = '22023';
  end if;

  select coalesce(sum(amount_paise), 0) into v_already_refunded
  from public.refunds
  where order_id = p_order_id and status in ('pending', 'processing', 'processed');

  if v_already_refunded + p_amount_paise > v_order.total_paise then
    raise exception 'Refund amount exceeds remaining refundable balance (already refunded/pending: %, order total: %)',
      v_already_refunded, v_order.total_paise using errcode = '22023';
  end if;

  insert into public.refunds (order_id, payment_attempt_id, amount_paise, reason, initiated_by)
  values (p_order_id, v_attempt.id, p_amount_paise, p_reason, v_admin_id)
  returning * into v_refund;

  update public.orders set payment_status = 'refund_pending' where id = p_order_id;

  insert into public.admin_audit_logs (admin_user_id, action, entity_type, entity_id, metadata)
  values (
    v_admin_id, 'initiate_refund', 'order', p_order_id,
    jsonb_build_object('refund_id', v_refund.id, 'amount_paise', p_amount_paise, 'reason', p_reason)
  );

  return v_refund;
end;
$$;

revoke execute on function public.initiate_refund(uuid, bigint, text) from public, anon;
grant execute on function public.initiate_refund(uuid, bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- reject_order / admin_cancel_order — a rejected or cancelled order that
-- had already been paid online owes the customer a refund. Re-created
-- here to flip payment_status to 'refund_pending' in that case (an admin
-- then calls initiate_refund + the razorpay-refund function separately —
-- this migration does not move money, only flags that it's owed).
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
  set status = 'rejected',
      rejection_reason = p_reason,
      payment_status = case when v_order.payment_status = 'paid' then 'refund_pending' else v_order.payment_status end
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
  set status = 'cancelled',
      rejection_reason = p_reason,
      payment_status = case when v_order.payment_status = 'paid' then 'refund_pending' else v_order.payment_status end
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
-- COD collection confirmation — deferred in Phase 5 and Phase 6 notes
-- ("COD revenue always shows ₹0 ... until that's added"). A COD order's
-- payment_status stays 'pending' through its whole lifecycle today; this
-- adds the one admin action that marks cash actually received, which is
-- what the dashboard's COD revenue figure was waiting on.
-- ---------------------------------------------------------------------------

alter table public.orders add column cod_collected_at timestamptz;

create or replace function public.record_cod_collection(p_order_id uuid)
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
  if v_order.payment_method <> 'cod' then
    raise exception 'Order is not a Cash on Delivery order' using errcode = '22023';
  end if;
  if v_order.status <> 'delivered' then
    raise exception 'Cash can only be recorded as collected once the order is delivered' using errcode = '22023';
  end if;
  if v_order.cod_collected_at is not null then
    raise exception 'Cash has already been recorded as collected for this order' using errcode = '22023';
  end if;

  update public.orders
  set payment_status = 'paid', cod_collected_at = now()
  where id = p_order_id
  returning * into v_order;

  insert into public.admin_audit_logs (admin_user_id, action, entity_type, entity_id)
  values (v_admin_id, 'record_cod_collection', 'order', p_order_id);

  return v_order;
end;
$$;

revoke execute on function public.record_cod_collection(uuid) from public, anon;
grant execute on function public.record_cod_collection(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- get_admin_dashboard_summary — re-created to report real COD collection
-- (via cod_collected_at, instead of the hardcoded 0 from Phase 5) and a
-- refund_pending_count for the new refund workflow.
-- ---------------------------------------------------------------------------

drop function if exists public.get_admin_dashboard_summary();

create function public.get_admin_dashboard_summary()
returns table (
  today_order_count bigint,
  pending_count bigint,
  paid_awaiting_acceptance_count bigint,
  accepted_count bigint,
  preparing_count bigint,
  ready_for_dispatch_count bigint,
  out_for_delivery_count bigint,
  delivered_count bigint,
  rejected_cancelled_count bigint,
  today_order_value_paise bigint,
  today_online_paid_paise bigint,
  today_cod_collected_paise bigint,
  today_net_realized_receipts_paise bigint,
  low_stock_count bigint,
  out_of_stock_count bigint,
  payment_reconciliation_warning_count bigint,
  refund_pending_count bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_admin();

  return query
  select
    (select count(*) from public.orders where created_at >= current_date),
    (select count(*) from public.orders where status = 'pending' and payment_status <> 'paid'),
    (select count(*) from public.orders where status = 'pending' and payment_status = 'paid'),
    (select count(*) from public.orders where status = 'accepted'),
    (select count(*) from public.orders where status = 'preparing'),
    (select count(*) from public.orders where status = 'ready_for_dispatch'),
    (select count(*) from public.orders where status = 'out_for_delivery'),
    (select count(*) from public.orders where status = 'delivered'),
    (select count(*) from public.orders where status in ('rejected', 'cancelled')),
    (select coalesce(sum(total_paise), 0)::bigint from public.orders where created_at >= current_date),
    (select coalesce(sum(total_paise), 0)::bigint from public.orders
       where created_at >= current_date and payment_method = 'razorpay' and payment_status = 'paid'),
    (select coalesce(sum(total_paise), 0)::bigint from public.orders
       where cod_collected_at >= current_date),
    (select coalesce(sum(total_paise), 0)::bigint from public.orders
       where created_at >= current_date and payment_method = 'razorpay' and payment_status = 'paid')
    + (select coalesce(sum(total_paise), 0)::bigint from public.orders where cod_collected_at >= current_date),
    (select count(*) from public.products
       where is_active and stock_weight_g > 0 and stock_weight_g <= reorder_threshold_g),
    (select count(*) from public.products where is_active and stock_weight_g < min_order_weight_g),
    (select count(*) from public.orders
       where payment_method = 'razorpay' and payment_status = 'paid' and status = 'pending'
         and created_at < now() - interval '2 hours'),
    (select count(*) from public.orders where payment_status = 'refund_pending');
end;
$$;

revoke execute on function public.get_admin_dashboard_summary() from public, anon;
grant execute on function public.get_admin_dashboard_summary() to authenticated;

-- ---------------------------------------------------------------------------
-- Performance: the dashboard's "today" figures filter by created_at, and
-- cod_collected_at is now filtered the same way — index both.
-- ---------------------------------------------------------------------------

create index orders_created_at_idx on public.orders (created_at);
create index orders_cod_collected_at_idx on public.orders (cod_collected_at) where cod_collected_at is not null;
