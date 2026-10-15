-- Phase 4: store settings, orders, order items, payments, and the
-- create_order function that is the only way an order ever comes into
-- existence.
--
-- No table in this migration grants authenticated clients INSERT/UPDATE
-- (except store_settings, admin-only). Orders are created exclusively
-- through private.create_order() below — a SECURITY DEFINER function that
-- re-validates everything server-side (spec section 11: "Create orders
-- using trusted backend operations"). Payment status is written only by
-- the Edge Functions in supabase/functions, which use the service-role
-- key and so bypass RLS entirely by design — there is deliberately no RLS
-- policy that would let a client set payment_status to 'paid' itself.

-- ---------------------------------------------------------------------------
-- store_settings — singleton row of admin-configurable commercial values
-- (spec section 3: "Do not hardcode commercial values throughout the
-- application"). Only delivery fee and tax are used by Phase 4; the rest
-- are here now so later phases don't need another settings migration.
-- ---------------------------------------------------------------------------

create table public.store_settings (
  id boolean primary key default true,
  delivery_fee_paise bigint not null default 4000,
  free_delivery_min_order_paise bigint,
  tax_rate_bps integer not null default 0,
  min_order_value_paise bigint not null default 0,
  cod_enabled boolean not null default true,
  online_payment_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint store_settings_singleton check (id)
);

insert into public.store_settings (id) values (true);

alter table public.store_settings enable row level security;

create policy "store_settings_select_all"
on public.store_settings for select
to anon, authenticated
using (true);

create policy "store_settings_update_admin"
on public.store_settings for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

grant select on public.store_settings to anon;
grant select, update on public.store_settings to authenticated;

create trigger set_store_settings_updated_at
before update on public.store_settings
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- orders / order_items
-- ---------------------------------------------------------------------------

create sequence public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users (id) on delete restrict,
  address_snapshot jsonb not null,
  status text not null default 'pending' check (
    status in (
      'pending', 'accepted', 'preparing', 'ready_for_dispatch',
      'out_for_delivery', 'delivered', 'rejected', 'cancelled'
    )
  ),
  payment_method text not null check (payment_method in ('razorpay', 'cod')),
  payment_status text not null default 'pending' check (
    payment_status in (
      'pending', 'authorized', 'paid', 'failed', 'cancelled',
      'refund_pending', 'refunded', 'partially_refunded'
    )
  ),
  subtotal_paise bigint not null check (subtotal_paise >= 0),
  tax_paise bigint not null default 0 check (tax_paise >= 0),
  delivery_fee_paise bigint not null default 0 check (delivery_fee_paise >= 0),
  discount_paise bigint not null default 0 check (discount_paise >= 0),
  total_paise bigint not null check (total_paise >= 0),
  idempotency_key text not null unique,
  customer_notes text,
  admin_notes text,
  rejection_reason text,
  accepted_by uuid references auth.users (id),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_payment_status_idx on public.orders (payment_status);

alter table public.orders enable row level security;

create policy "orders_select_own_or_admin"
on public.orders for select
to authenticated
using ((select auth.uid()) = user_id or (select private.is_admin()));

-- Deliberately no insert/update/delete policy for authenticated: orders
-- are written only by private.create_order() (SECURITY DEFINER) and by
-- the Edge Functions (service role, bypasses RLS). Admin order management
-- (accept/reject/status updates) in Phase 5 adds its own SECURITY DEFINER
-- functions rather than a generic admin UPDATE policy, so every status
-- transition stays auditable and validated in one place.

grant select on public.orders to authenticated;

create trigger set_orders_updated_at
before update on public.orders
for each row execute function private.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  unit_price_per_kg_paise bigint not null check (unit_price_per_kg_paise > 0),
  quantity_g integer not null check (quantity_g > 0),
  subtotal_paise bigint not null check (subtotal_paise >= 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

alter table public.order_items enable row level security;

create policy "order_items_select_own_or_admin"
on public.order_items for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = (select auth.uid()) or (select private.is_admin()))
  )
);

grant select on public.order_items to authenticated;

-- ---------------------------------------------------------------------------
-- payment_attempts / payment_webhook_events
-- ---------------------------------------------------------------------------

create table public.payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null default 'razorpay',
  provider_order_id text,
  provider_payment_id text,
  amount_paise bigint not null check (amount_paise >= 0),
  currency text not null default 'INR',
  status text not null default 'created' check (
    status in ('created', 'pending', 'authorized', 'paid', 'failed', 'cancelled')
  ),
  idempotency_key text not null unique,
  failure_reason text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_order_id)
);

create index payment_attempts_order_id_idx on public.payment_attempts (order_id);

alter table public.payment_attempts enable row level security;

create policy "payment_attempts_select_own_or_admin"
on public.payment_attempts for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = payment_attempts.order_id
      and (o.user_id = (select auth.uid()) or (select private.is_admin()))
  )
);

-- No insert/update policy at all: written only by Edge Functions via the
-- service-role key (razorpay-create-order, razorpay-verify-payment,
-- razorpay-webhook). A customer can read their own payment attempts but
-- can never create or alter one.
grant select on public.payment_attempts to authenticated;

create trigger set_payment_attempts_updated_at
before update on public.payment_attempts
for each row execute function private.set_updated_at();

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'razorpay',
  provider_event_id text not null,
  event_type text,
  processing_status text not null default 'received' check (
    processing_status in ('received', 'processed', 'ignored', 'failed')
  ),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

-- RLS enabled with zero policies: not even the owning customer can read
-- this table. Only the service role (the webhook Edge Function) ever
-- touches it. Raw payment payloads are not stored here (spec section 16:
-- "Do not store unnecessary raw payment data or sensitive payment
-- credentials") — just enough to dedupe and audit delivery.
alter table public.payment_webhook_events enable row level security;

-- ---------------------------------------------------------------------------
-- public.create_order — the only way an order is created.
--
-- Lives in `public` (unlike the private.* helpers) because it must be
-- callable by the client via supabase.rpc() — PostgREST only exposes
-- functions in public/other explicitly-exposed schemas. It is still
-- SECURITY DEFINER-with-care per the skill's guidance for a genuinely
-- public, business-operation RPC: search_path pinned, the caller's
-- identity re-derived from auth.uid() (never trusted as a parameter), and
-- EXECUTE revoked from anon below.
--
-- Re-validates everything from the live database: cart contents, product
-- prices/stock/active status, the address, and store settings. Never
-- trusts a client-provided price or total. Idempotent on
-- (user_id, idempotency_key): a retried call with the same key returns
-- the already-created order instead of creating a duplicate (spec section
-- 11: "Repeated taps, client retries... must not create duplicate
-- orders"). Does not touch products.stock_weight_g (spec section 12:
-- stock is deducted only on admin acceptance, in a later phase) and
-- clears the cart only after the order is successfully committed.
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

  -- Idempotency: a retried request with the same key returns the
  -- existing order rather than erroring or duplicating it.
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

  -- Lock the cart's product rows so a concurrent price/stock change can't
  -- be read half-applied, and compute the authoritative subtotal from
  -- live prices (never from the client).
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
    -- Lost a race with a concurrent retry using the same idempotency key.
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

  return v_order;
end;
$$;

revoke execute on function public.create_order(uuid, text, text, text) from public, anon;
grant execute on function public.create_order(uuid, text, text, text) to authenticated;
