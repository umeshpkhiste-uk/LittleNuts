-- Run this manually in the Supabase Dashboard SQL Editor (or via a
-- service-role connection) to grant admin access to a store administrator.
-- This is NOT a migration — it is not run automatically, because the two
-- admin accounts are specific to your deployment and never belong in
-- version control as hardcoded emails (spec section 25: "Never hardcode
-- production credentials").
--
-- Steps:
--   1. Have the admin create a normal account first (email/password
--      sign-up through the app, or create the user directly in
--      Authentication > Users in the dashboard). The on_auth_user_created
--      trigger (see migrations/20261015184957_init_auth_and_profiles.sql)
--      will have already given them a profile row and an implicit
--      'customer' role row in user_roles.
--   2. Replace the email below with the real admin's email and run this.
--   3. Repeat for the second admin.
--
-- Safe to re-run for the same email (upsert on the user_roles.user_id
-- unique constraint).

insert into public.user_roles (user_id, role, created_by)
select id, 'admin', id
from auth.users
where email = 'admin1@example.com'
on conflict (user_id) do update set role = 'admin';

-- Verify:
-- select u.email, r.role from public.user_roles r
-- join auth.users u on u.id = r.user_id
-- where r.role = 'admin';
