-- Favorites/wishlist: lets a customer save a product for later. Previously
-- the heart icons on Home/Categories/Product Details were local-only UI
-- stubs (reset on every reload) — this makes them real and gives the
-- profile page's "Favorite Items" stat a real number to show.

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index favorites_user_id_idx on public.favorites (user_id);
create index favorites_product_id_idx on public.favorites (product_id);

alter table public.favorites enable row level security;

-- A customer can only ever see/add/remove their own favorites — there's no
-- admin or cross-user read case to support here, unlike carts.
create policy "favorites_owner_all"
on public.favorites for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, delete on public.favorites to authenticated;
