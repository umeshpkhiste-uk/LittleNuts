# LittleNuts

Dry fruit e-commerce Android app. Customers browse and buy dry fruits by
weight (grams/kilograms); two store administrators manage orders, pricing,
and inventory from an in-app admin interface on the same Supabase backend.

Full requirements: `design-assets/Master Prompt.rtf`. Visual reference:
`design-assets/App Design/`.

## Structure

```
apps/mobile/          Expo Router app (customer + admin UI)
packages/shared/       Shared TypeScript logic (money/weight math, types)
supabase/migrations/   Versioned SQL: schema, RLS, database functions
supabase/functions/    Edge Functions (Razorpay order creation, webhooks)
tests/                 unit / integration / rls test suites
scripts/                Seed and release scripts
design-assets/          Master prompt, design samples, logo, banners (reference only)
```

## Stack

React Native + Expo (Router, TypeScript strict) · Supabase (Postgres, Auth,
Realtime, Storage, RLS) · Zustand · TanStack Query · React Hook Form + Zod ·
Razorpay · Expo EAS (Android builds/release).

## Getting started

```bash
cd apps/mobile
npm install
npx expo start
```

`apps/mobile/.env` already exists (git-ignored) with the LittleNuts Supabase
project's URL and publishable key — see `.env.example` at the repo root for
what each variable is and which ones must never leave the server side.

### Supabase (CLI-driven, not MCP)

The Supabase MCP connector hits an environment bug here, so schema changes
go through the CLI instead:

```bash
supabase login                                      # one-time, run in a real terminal
supabase link --project-ref oaslejowibcvprddusbv     # one-time per machine
supabase migration new <name>
supabase db push --dry-run && supabase db push
supabase db advisors --linked --type all
```

See `supabase/README.md` for the full workflow and the role-provisioning
procedure (`supabase/grant_admin_role.sql`).

Requires an Android emulator/device (or Expo Go, once native-module-free) to
run. Use `npx expo run:android` for a development build once native modules
(image picker, notifications, etc.) are in use.

## Quality gates

Run before considering any phase done:

```bash
cd apps/mobile
npx tsc --noEmit
npx expo lint
npx expo-doctor
```

## Implementation phases

See `IMPLEMENTATION_STATUS.md` for current phase progress, and
`design-assets/Master Prompt.rtf` section 24 for the full phase breakdown:

1. Project foundation
2. Supabase & authentication
3. Product catalog & cart
4. Checkout & payments (Razorpay + COD)
5. Admin order management
6. Inventory & dual-admin realtime sync
7. Refunds & production hardening
8. Release (Play Store)

## Security notes

- The mobile app only ever holds the Supabase **publishable/anon** key and
  the Razorpay **Key ID**. The Supabase service-role key and Razorpay key
  secret/webhook secret live only in Supabase Edge Function secrets — never
  in this repo, this app, or any `EXPO_PUBLIC_*` variable.
- Every privileged operation (accept order, adjust stock, change price) is
  enforced server-side via RLS and `SECURITY DEFINER` database functions,
  not just hidden in the UI. See `apps/mobile/src/lib/security/README.md`.
