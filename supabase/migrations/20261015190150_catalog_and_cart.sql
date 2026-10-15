-- Phase 3: product catalog (categories, products), persistent cart, and
-- product image storage.
--
-- Catalog is publicly browsable (anon + authenticated both see active
-- categories/products) — spec section 6 lets customers browse without
-- implying login is required to look around. Writes are admin-only via
-- private.is_admin(). Carts are per-user and require authentication.

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index categories_is_active_sort_idx on public.categories (is_active, sort_order);

alter table public.categories enable row level security;

create policy "categories_select_active_anon"
on public.categories for select
to anon
using (is_active);

create policy "categories_select_active_or_admin"
on public.categories for select
to authenticated
using (is_active or (select private.is_admin()));

-- Split into insert/update/delete (not "for all") so these don't become a
-- second permissive SELECT policy alongside the two above.
create policy "categories_insert_admin"
on public.categories for insert
to authenticated
with check ((select private.is_admin()));

create policy "categories_update_admin"
on public.categories for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "categories_delete_admin"
on public.categories for delete
to authenticated
using ((select private.is_admin()));

grant select on public.categories to anon;
grant select, insert, update, delete on public.categories to authenticated;

create trigger set_categories_updated_at
before update on public.categories
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  sku text not null unique,
  short_description text,
  description text,
  image_urls text[] not null default '{}',
  price_per_kg_paise bigint not null check (price_per_kg_paise > 0),
  min_order_weight_g integer not null check (min_order_weight_g > 0),
  max_order_weight_g integer check (max_order_weight_g is null or max_order_weight_g >= min_order_weight_g),
  weight_increment_g integer not null check (weight_increment_g > 0),
  stock_weight_g integer not null default 0 check (stock_weight_g >= 0),
  reorder_threshold_g integer not null default 0 check (reorder_threshold_g >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_is_active_idx on public.products (is_active) where is_active;
create index products_is_featured_idx on public.products (is_featured) where is_featured;

alter table public.products enable row level security;

create policy "products_select_active_anon"
on public.products for select
to anon
using (is_active);

create policy "products_select_active_or_admin"
on public.products for select
to authenticated
using (is_active or (select private.is_admin()));

create policy "products_insert_admin"
on public.products for insert
to authenticated
with check ((select private.is_admin()));

create policy "products_update_admin"
on public.products for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "products_delete_admin"
on public.products for delete
to authenticated
using ((select private.is_admin()));

grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;

create trigger set_products_updated_at
before update on public.products
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- carts / cart_items
--
-- One cart per user (unique user_id) — the client upserts on first add, so
-- there is never an "ambiguous current cart" to resolve. Adding to the
-- cart never touches products.stock_weight_g (spec section 9: "The cart is
-- not a stock reservation").
-- ---------------------------------------------------------------------------

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.carts enable row level security;

create policy "carts_owner_all"
on public.carts for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.carts to authenticated;

create trigger set_carts_updated_at
before update on public.carts
for each row execute function private.set_updated_at();

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity_g integer not null check (quantity_g > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);

create index cart_items_cart_id_idx on public.cart_items (cart_id);
create index cart_items_product_id_idx on public.cart_items (product_id);

alter table public.cart_items enable row level security;

create policy "cart_items_owner_all"
on public.cart_items for all
to authenticated
using (
  exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.carts c
    where c.id = cart_items.cart_id
      and c.user_id = (select auth.uid())
  )
);

grant select, insert, update, delete on public.cart_items to authenticated;

create trigger set_cart_items_updated_at
before update on public.cart_items
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- product image storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read"
on storage.objects for select
to public
using (bucket_id = 'product-images');

create policy "product_images_admin_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images' and (select private.is_admin()));

create policy "product_images_admin_update"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images' and (select private.is_admin()))
with check (bucket_id = 'product-images' and (select private.is_admin()));

create policy "product_images_admin_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'product-images' and (select private.is_admin()));
