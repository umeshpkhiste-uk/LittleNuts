-- Fixes two warnings from `supabase db advisors` after the previous migration:
--
-- 1. private.set_updated_at had a mutable search_path (every other function
--    in this project sets search_path = '' already — this one was missed).
-- 2. public.profiles had two permissive SELECT policies for `authenticated`
--    (own-row + admin), which Postgres evaluates as a separate check each —
--    merged into one.

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop policy "profiles_select_own" on public.profiles;
drop policy "profiles_select_admin" on public.profiles;

create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (
  (select auth.uid()) = id
  or (select private.is_admin())
);
