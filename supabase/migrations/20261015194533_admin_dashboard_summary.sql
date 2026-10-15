-- public.get_admin_dashboard_summary — spec section 17 names this
-- explicitly. One round trip for the admin dashboard's counts instead of
-- many separate client-side queries, and the one place these definitions
-- (e.g. what counts as "low stock") live.
--
-- Revenue fields deliberately distinguish order value from realized
-- receipts (spec section 14: "Do not treat all placed orders as realized
-- revenue"). COD collection confirmation is a dedicated future action
-- (spec's record_cod_collection, not yet built — no COD order is ever
-- counted as collected here, even once delivered) so
-- today_cod_collected_paise is always 0 for now; it's a real column, not
-- omitted, so the client doesn't have to guess why COD revenue is absent.

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
    (select coalesce(sum(total_paise), 0) from public.orders where created_at >= current_date),
    (select coalesce(sum(total_paise), 0) from public.orders
       where created_at >= current_date and payment_method = 'razorpay' and payment_status = 'paid'),
    0::bigint,
    (select coalesce(sum(total_paise), 0) from public.orders
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
