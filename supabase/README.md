# Supabase backend

Project: **LittleNuts** (`oaslejowibcvprddusbv`, ap-northeast-1). Linked via
the Supabase CLI (`supabase link --project-ref oaslejowibcvprddusbv`) — the
project-scoped `.mcp.json` Supabase MCP connector hit a OAuth bug in this
environment ("resource must be a valid MCP endpoint"), so schema work is
done via `supabase db push` instead. Re-check the MCP connector occasionally
in case it's fixed; it's a more convenient path when it works.

- `migrations/` — version-controlled SQL migrations: tables, constraints,
  indexes, RLS policies, triggers, and `SECURITY DEFINER` functions
  (`create_order`, `accept_order`, `reject_order`, `adjust_inventory`, etc.
  — the order/payment/inventory ones land in Phases 4-6). Phase 2 added
  `profiles`, `user_roles`, and `addresses` with RLS.
- `functions/` — Supabase Edge Functions for logic that must run with
  secrets that can never ship in the mobile app: Razorpay order creation,
  payment signature verification, webhook processing. Populated in Phase 4.
- `grant_admin_role.sql` — manual, non-migration script to promote a signed-up
  user to admin. Run in the Dashboard SQL Editor once each admin has an
  account (see the file for the full procedure).

## Applying migrations

```bash
supabase login              # one-time, native browser OAuth (run in a real terminal, not through an agent)
supabase link --project-ref oaslejowibcvprddusbv   # one-time per machine
supabase migration new <name>   # create a new migration file — never hand-name one
# edit the generated file
supabase db push --dry-run  # review what would change
supabase db push            # apply to the live project
supabase db advisors --linked --type all   # check for security/performance issues after schema changes
```

No local Docker/Postgres stack is used — migrations are written by hand and
pushed straight to the hosted project. `supabase status` will report a
docker error; that's expected and unrelated to `db push`.

## Role model

Every authenticated user is implicitly a "customer". A row in
`public.user_roles` with `role = 'admin'` is the only thing that grants
admin access, and that table has no INSERT/UPDATE/DELETE policy and no
privileges granted to `anon`/`authenticated` — only a service-role
connection (the Dashboard SQL Editor, `grant_admin_role.sql`, or a future
trusted server-side process) can create or change a role assignment. See
`migrations/20261015184957_init_auth_and_profiles.sql` for the full
mechanism (`private.is_admin()`, the `on_auth_user_created` trigger, RLS
policies).
