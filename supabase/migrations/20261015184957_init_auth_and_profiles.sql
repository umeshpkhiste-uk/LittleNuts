-- Phase 2: profiles, role assignment, and customer addresses.
--
-- Role model: every authenticated user is implicitly a "customer". A row in
-- public.user_roles with role = 'admin' is the ONLY thing that grants admin
-- access, and that table is never writable by the anon/authenticated roles
-- (no INSERT/UPDATE/DELETE policy, no privileges granted below) — only a
-- service-role connection (dashboard SQL editor, a migration, or a future
-- trusted server-side process) can create or change a role assignment. This
-- is what makes "customers cannot self-assign admin" a backend guarantee
-- rather than a UI convention. See supabase/README.md for how to grant the
-- two store admins their role after they've signed up.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

grant select, update on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  unique (user_id)
);

create index user_roles_user_id_idx on public.user_roles (user_id);

alter table public.user_roles enable row level security;

-- Customers may read their own role row (so the client can confirm it's
-- "customer" rather than inferring it from the absence of a row — simpler
-- and harder to get wrong on the client). No insert/update/delete policy
-- exists for any client role, and no privileges beyond SELECT are granted
-- below: role changes can only happen through a service-role connection.
create policy "user_roles_select_own"
on public.user_roles for select
to authenticated
using ((select auth.uid()) = user_id);

grant select on public.user_roles to authenticated;

-- ---------------------------------------------------------------------------
-- private.is_admin() — the one helper every later admin-only RLS policy and
-- SECURITY DEFINER function (accept_order, adjust_inventory, etc. in later
-- phases) should call instead of re-deriving the check inline.
-- ---------------------------------------------------------------------------

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- SECURITY DEFINER functions are PUBLIC-executable by default in Postgres;
-- revoke that and grant only to the role that actually needs to call it from
-- an RLS policy. anon never needs this (anonymous users are never admins).
revoke execute on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

-- Admins can read every profile (needed to show customer names on orders in
-- Phase 5). Added now, while the policy set for this table is still small.
create policy "profiles_select_admin"
on public.profiles for select
to authenticated
using ((select private.is_admin()));

-- ---------------------------------------------------------------------------
-- New-user bootstrap: every signup gets a profile row and an implicit
-- "customer" role row, via a trigger on auth.users (the standard Supabase
-- pattern — this is the only supported way to react to signup server-side).
-- ---------------------------------------------------------------------------

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone_number)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.phone
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role, created_by)
  values (new.id, 'customer', new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- shared updated_at trigger helper
-- ---------------------------------------------------------------------------

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  recipient_name text not null,
  phone_number text not null,
  address_line_1 text not null,
  address_line_2 text,
  area text,
  city text not null,
  state text not null,
  postal_code text not null,
  delivery_instructions text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);

-- At most one default address per user. Paired with the trigger below
-- (which unsets siblings before a new default is written) so the
-- constraint should never actually fire in normal use — it exists as a
-- hard backstop against a bug or race condition, not as the primary
-- mechanism.
create unique index addresses_one_default_per_user
on public.addresses (user_id)
where is_default;

alter table public.addresses enable row level security;

create policy "addresses_select_own"
on public.addresses for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "addresses_insert_own"
on public.addresses for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "addresses_update_own"
on public.addresses for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "addresses_delete_own"
on public.addresses for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.addresses to authenticated;

create trigger set_addresses_updated_at
before update on public.addresses
for each row execute function private.set_updated_at();

create or replace function private.enforce_single_default_address()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_default then
    update public.addresses
    set is_default = false
    where user_id = new.user_id
      and id <> new.id
      and is_default = true;
  end if;
  return new;
end;
$$;

revoke execute on function private.enforce_single_default_address() from public, anon, authenticated;

create trigger addresses_single_default
before insert or update of is_default on public.addresses
for each row
when (new.is_default)
execute function private.enforce_single_default_address();
