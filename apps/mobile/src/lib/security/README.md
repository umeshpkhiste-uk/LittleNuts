# Security helpers

This folder holds client-side security *conveniences* only — role-based
navigation guards, session checks, admin-route redirects. They improve UX
(hide admin screens from customers, bounce unauthenticated users to login).

**They are not the source of truth for authorization.** Every privileged
operation (accepting an order, adjusting stock, changing prices, viewing
other users' data) must be enforced again on the backend via:

- Row Level Security policies in `supabase/migrations`
- `SECURITY DEFINER` database functions in `supabase/migrations` that
  re-validate the caller's role from `user_roles` before acting
- Supabase Edge Functions in `supabase/functions` for payment/webhook logic

A customer bypassing the UI (modifying requests, calling a Postgres
function directly) must still be rejected by the database layer. Populated
starting in Phase 2 (`role-guard.ts`, `use-require-role.ts`).
