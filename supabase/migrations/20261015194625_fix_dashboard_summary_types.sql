-- Fix: sum(bigint) returns numeric in Postgres, not bigint, which didn't
-- match the declared RETURNS TABLE column type. Cast each sum explicitly.

create or replace function public.get_admin_dashboard_summary()
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
  payment_reconciliation_warning_count bigint
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
    0::bigint,
    (select coalesce(sum(total_paise), 0)::bigint from public.orders
       where created_at >= current_date and payment_method = 'razorpay' and payment_status = 'paid'),
    (select count(*) from public.products
       where is_active and stock_weight_g > 0 and stock_weight_g <= reorder_threshold_g),
    (select count(*) from public.products where is_active and stock_weight_g < min_order_weight_g),
    (select count(*) from public.orders
       where payment_method = 'razorpay' and payment_status = 'paid' and status = 'pending'
         and created_at < now() - interval '2 hours');
end;
$$;

revoke execute on function public.get_admin_dashboard_summary() from public, anon;
grant execute on function public.get_admin_dashboard_summary() to authenticated;
