# Tests

- `unit/` — pure logic (money/weight math, validators) and component tests
  for the mobile app. Added alongside `packages/shared` and screen logic
  starting Phase 2-3.
- `integration/` — multi-step flows against a local/staging Supabase
  instance (order creation, payment verification, accept-order concurrency).
  Added starting Phase 4.
- `rls/` — Row Level Security policy tests (customer isolation, role
  escalation prevention, admin authorization). Added starting Phase 2.

Never run integration or RLS tests against the production Supabase project.
Use a dedicated test project or the Supabase local dev stack.
