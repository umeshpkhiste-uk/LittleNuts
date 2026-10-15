-- Access-control regression suite (Phase 7, spec section 24/25: "access-
-- control tests"). Exercises RLS and the admin-only SECURITY DEFINER
-- functions directly against a live/linked database, the same way each
-- phase's own verification already did ad hoc — consolidated here as a
-- single committed, rerunnable script instead of a throwaway script.
--
-- Run with:
--   supabase db query --linked --file supabase/tests/access_control_test.sql
--
-- Any failure raises an exception with a 'FAIL:' prefix, which aborts the
-- whole transaction (and therefore the cleanup at the end) — so a failure
-- here leaves no residue to clean up by hand; just re-run after fixing.
-- An empty `rows: []` result with no error means every check passed
-- (RAISE NOTICE output isn't returned by `supabase db query`, only errors
-- are).
--
-- This is deliberately an access-control suite, not a full functional
-- regression suite — business-logic correctness (stock math, pricing,
-- refund totals, etc.) is exercised by the phase-specific scripts used
-- when each feature was built (see IMPLEMENTATION_STATUS.md).

-- Session-local helper (pg_temp, dropped automatically when this
-- connection ends) — asserts that calling `sql` under the current role
-- fails with "Admin privileges required", nothing else.
create or replace function pg_temp.assert_admin_only(p_label text, p_sql text)
returns void
language plpgsql
as $fn$
begin
  begin
    execute p_sql;
    raise exception 'FAIL: % should have required admin privileges', p_label;
  exception
    when others then
      if sqlerrm like 'FAIL:%' then
        raise;
      end if;
      if sqlerrm not like '%Admin privileges required%' then
        raise exception 'FAIL: % raised an unexpected error instead of the admin check: %', p_label, sqlerrm;
      end if;
  end;
end;
$fn$;

do $$
declare
  v_admin_id uuid := gen_random_uuid();
  v_customer_a_id uuid := gen_random_uuid();
  v_customer_b_id uuid := gen_random_uuid();
  v_category_id uuid;
  v_product_id uuid;
  v_address_a_id uuid;
  v_order_a_id uuid;
  v_result record;
  v_count int;
begin
  insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'act-admin@test.local', 'x', now(), '{}', '{}', 'authenticated', 'authenticated'),
    (v_customer_a_id, '00000000-0000-0000-0000-000000000000', 'act-customer-a@test.local', 'x', now(), '{}', '{}', 'authenticated', 'authenticated'),
    (v_customer_b_id, '00000000-0000-0000-0000-000000000000', 'act-customer-b@test.local', 'x', now(), '{}', '{}', 'authenticated', 'authenticated');

  update public.user_roles set role = 'admin' where user_id = v_admin_id;

  insert into public.categories (name, slug) values ('ACT Test Cat', 'act-test-cat')
  returning id into v_category_id;

  insert into public.products (category_id, name, slug, sku, price_per_kg_paise, min_order_weight_g, weight_increment_g, stock_weight_g, reorder_threshold_g)
  values (v_category_id, 'ACT Test Nuts', 'act-test-nuts', 'ACT-SKU-1', 100000, 100, 50, 1000, 200)
  returning id into v_product_id;

  insert into public.addresses (user_id, recipient_name, phone_number, address_line_1, city, state, postal_code, is_default)
  values (v_customer_a_id, 'Customer A', '9999999999', '1 Test St', 'Pune', 'MH', '411001', true)
  returning id into v_address_a_id;

  perform set_config('request.jwt.claims', json_build_object('sub', v_customer_a_id)::text, true);
  set local role authenticated;
  insert into public.carts (user_id) values (v_customer_a_id);
  insert into public.cart_items (cart_id, product_id, quantity_g)
  select id, v_product_id, 100 from public.carts where user_id = v_customer_a_id;
  select * into v_result from public.create_order(v_address_a_id, 'cod', 'act-key-1');
  v_order_a_id := v_result.id;
  reset role;

  -- ===========================================================================
  -- 1. anon cannot read anything customer- or admin-scoped
  -- ===========================================================================
  reset role;
  set local role anon;

  select count(*) into v_count from public.orders;
  if v_count <> 0 then raise exception 'FAIL: anon could read orders (% rows)', v_count; end if;

  select count(*) into v_count from public.order_items;
  if v_count <> 0 then raise exception 'FAIL: anon could read order_items (% rows)', v_count; end if;

  select count(*) into v_count from public.addresses;
  if v_count <> 0 then raise exception 'FAIL: anon could read addresses (% rows)', v_count; end if;

  select count(*) into v_count from public.notifications;
  if v_count <> 0 then raise exception 'FAIL: anon could read notifications (% rows)', v_count; end if;

  select count(*) into v_count from public.admin_audit_logs;
  if v_count <> 0 then raise exception 'FAIL: anon could read admin_audit_logs (% rows)', v_count; end if;

  select count(*) into v_count from public.inventory_movements;
  if v_count <> 0 then raise exception 'FAIL: anon could read inventory_movements (% rows)', v_count; end if;

  select count(*) into v_count from public.refunds;
  if v_count <> 0 then raise exception 'FAIL: anon could read refunds (% rows)', v_count; end if;

  -- anon SHOULD see only active products/categories (the public catalog)
  select count(*) into v_count from public.products where id = v_product_id;
  if v_count <> 1 then raise exception 'FAIL: anon could not read an active product'; end if;

  reset role;

  -- ===========================================================================
  -- 2. customer B cannot read customer A's private data
  -- ===========================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', v_customer_b_id)::text, true);
  set local role authenticated;

  select count(*) into v_count from public.orders where id = v_order_a_id;
  if v_count <> 0 then raise exception 'FAIL: customer B could read customer A''s order'; end if;

  select count(*) into v_count from public.addresses where id = v_address_a_id;
  if v_count <> 0 then raise exception 'FAIL: customer B could read customer A''s address'; end if;

  -- customer B cannot cancel customer A's order either
  begin
    perform public.cancel_order(v_order_a_id, 'not mine');
    raise exception 'FAIL: customer B was able to cancel customer A''s order';
  exception
    when others then
      if sqlerrm not like 'Order not found%' then
        raise exception 'FAIL: unexpected error for cross-customer cancel_order: %', sqlerrm;
      end if;
  end;

  reset role;

  -- ===========================================================================
  -- 3. a non-admin customer cannot call any admin-only function
  -- ===========================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', v_customer_a_id)::text, true);
  set local role authenticated;

  perform pg_temp.assert_admin_only('accept_order', format('select public.accept_order(%L)', v_order_a_id));
  perform pg_temp.assert_admin_only('reject_order', format('select public.reject_order(%L, %L)', v_order_a_id, 'x'));
  perform pg_temp.assert_admin_only('update_order_status', format('select public.update_order_status(%L, %L)', v_order_a_id, 'preparing'));
  perform pg_temp.assert_admin_only('admin_cancel_order', format('select public.admin_cancel_order(%L, %L)', v_order_a_id, 'x'));
  perform pg_temp.assert_admin_only('adjust_product_stock', format('select public.adjust_product_stock(%L, %L, %L)', v_product_id, 500, 'x'));
  perform pg_temp.assert_admin_only('initiate_refund', format('select public.initiate_refund(%L, %L, %L)', v_order_a_id, 100, 'x'));
  perform pg_temp.assert_admin_only('record_cod_collection', format('select public.record_cod_collection(%L)', v_order_a_id));
  perform pg_temp.assert_admin_only('get_admin_dashboard_summary', 'select public.get_admin_dashboard_summary()');

  reset role;

  -- ===========================================================================
  -- 4. the admin CAN call admin-only functions (no privilege error; may
  --    still fail on business-logic preconditions, which is fine here —
  --    this suite only cares that the admin gate itself opens)
  -- ===========================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', v_admin_id)::text, true);
  set local role authenticated;

  perform public.get_admin_dashboard_summary();

  begin
    perform public.update_order_status(v_order_a_id, 'preparing');
    raise exception 'FAIL: update_order_status should have failed (order is pending, not accepted)';
  exception
    when others then
      if sqlerrm like '%Admin privileges required%' then
        raise exception 'FAIL: admin was denied update_order_status';
      end if;
      -- any other error (business-logic precondition) is expected here.
  end;

  reset role;

  raise notice 'ALL ACCESS CONTROL CHECKS PASSED';

  -- ===========================================================================
  -- cleanup
  -- ===========================================================================
  delete from public.order_status_history where order_id = v_order_a_id;
  delete from public.admin_audit_logs where entity_id in (v_order_a_id, v_product_id);
  delete from public.notifications where related_order_id = v_order_a_id;
  delete from public.order_items where order_id = v_order_a_id;
  delete from public.orders where id = v_order_a_id;
  delete from public.cart_items where cart_id in (select id from public.carts where user_id = v_customer_a_id);
  delete from public.carts where user_id = v_customer_a_id;
  delete from public.addresses where id = v_address_a_id;
  delete from public.products where id = v_product_id;
  delete from public.categories where id = v_category_id;
  update public.user_roles set role = 'customer' where user_id = v_admin_id;
  delete from auth.users where id in (v_admin_id, v_customer_a_id, v_customer_b_id);

  raise notice 'CLEANUP COMPLETE';
end;
$$;
