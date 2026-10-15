# Supabase backend

- `migrations/` — version-controlled SQL migrations: tables, constraints, indexes,
  RLS policies, triggers, and `SECURITY DEFINER` functions (`create_order`,
  `accept_order`, `reject_order`, `adjust_inventory`, etc.). Populated starting
  Phase 2 (auth/profiles/roles), extended through Phase 6 (inventory).
- `functions/` — Supabase Edge Functions for logic that must run with secrets
  that can never ship in the mobile app: Razorpay order creation, payment
  signature verification, webhook processing. Populated in Phase 4.

Run migrations locally with the Supabase CLI (`supabase db push` /
`supabase migration up`) once a project is linked — see the root README for
setup once Phase 2 provisions a project.
