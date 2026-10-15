# LittleNuts — Android Release Guide

This is the step-by-step process to take the current codebase to a
production release candidate on the Google Play Store. Every step here
requires an account or credential that belongs to you (Expo/EAS account,
Google Play Console account, production Razorpay account) — none of it can
be done from inside this environment, so this document is the handoff.

See `IMPLEMENTATION_STATUS.md` for what's built and verified per phase, and
`supabase/README.md` for the backend's day-to-day operational notes.

## 1. Prerequisites checklist

Before starting a production build, have these ready:

- [ ] An [Expo (EAS)](https://expo.dev) account, with this project's
      `apps/mobile` directory as its working directory.
- [ ] A [Google Play Console](https://play.google.com/console) developer
      account (one-time registration fee).
- [ ] A **production** Razorpay account in live mode (the Phase 4–7 work
      was built and verified against Razorpay's *test* mode — see "Payments"
      below).
- [ ] A hosted privacy policy URL (required by both the Play Console and
      Razorpay's live-mode activation).
- [ ] Store listing assets: app icon (already in `apps/mobile/assets/icon.png`,
      1024×1024), a feature graphic (1024×500), phone screenshots, a short
      description (≤80 chars) and full description (≤4000 chars).
- [ ] A decision on crash reporting (Sentry, Bugsnag, or similar) — none is
      wired in yet (see "Known gaps" below).

## 2. Backend: confirm production-ready state

The backend is already live and migrated (Supabase project
`oaslejowibcvprddusbv`, see `supabase/README.md`). Before release:

1. Confirm all migrations are applied: `supabase db push` (should report
   "up to date").
2. Run the access-control regression suite one more time:
   ```
   supabase db query --linked --file supabase/tests/access_control_test.sql
   ```
   No error output (empty `rows: []`) means every check passed.
3. Run `supabase db advisors --linked --type all` and `--type performance`.
   The only expected findings are the `authenticated_security_definer_function_executable`
   warnings on the admin-only RPCs (`accept_order`, `reject_order`,
   `update_order_status`, `admin_cancel_order`, `cancel_order`,
   `create_order`, `adjust_product_stock`, `initiate_refund`,
   `record_cod_collection`, `get_admin_dashboard_summary`) — each of these
   starts with an explicit `private.require_admin()` (or re-derives
   `auth.uid()` for customer-owned actions) check, so this is intentional,
   not a gap. Any *other* finding should be investigated before release.
4. Set the **production** Razorpay secrets (replacing the test-mode values
   used during development):
   ```
   supabase secrets set RAZORPAY_KEY_ID=rzp_live_...
   supabase secrets set RAZORPAY_KEY_SECRET=...
   supabase secrets set RAZORPAY_WEBHOOK_SECRET=...
   ```
5. In the Razorpay dashboard (live mode), configure the webhook URL to:
   ```
   https://oaslejowibcvprddusbv.supabase.co/functions/v1/razorpay-webhook
   ```
   subscribed to at least `payment.captured`, `payment.failed`,
   `refund.processed`, and `refund.failed`. Use the same secret you set as
   `RAZORPAY_WEBHOOK_SECRET` above.
6. Provision your real admin accounts: have each admin sign up normally in
   the app, then run `supabase/grant_admin_role.sql` (edit the email in the
   script first) via `supabase db query --linked --file supabase/grant_admin_role.sql`
   for each one.
7. Review `store_settings` (delivery fee, tax rate, min order value,
   COD/online toggles) via the Supabase SQL editor — there's no admin UI for
   this yet (see "Known gaps").
8. Confirm the Supabase project's email provider is configured for
   production volume. The default built-in provider has a low send-rate
   limit (hit during Phase 3 testing) — set up a custom SMTP provider under
   Project Settings → Auth before relying on signup/reset emails at scale.

## 3. App: production environment values

The mobile app's `EXPO_PUBLIC_*` values are safe to expose (never put a
secret key behind `EXPO_PUBLIC_`), but production builds should still pull
them from EAS's own environment variable store rather than a local `.env`
file, so a build is reproducible from any machine:

```
eas login
cd apps/mobile
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value "https://oaslejowibcvprddusbv.supabase.co"
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "<publishable key>"
eas env:create --environment production --name EXPO_PUBLIC_RAZORPAY_KEY_ID --value "rzp_live_..."
```

(`eas.json`'s `production` build profile already sets
`EXPO_PUBLIC_APP_ENV=production` directly.)

## 4. Build

```
cd apps/mobile
eas build:configure        # first time only — links this project to your EAS account
eas build --platform android --profile production
```

This produces an `.aab` (Android App Bundle, per `eas.json`'s
`"buildType": "app-bundle"`), which is what Play Console expects. EAS can
manage your Android signing keystore for you (recommended for a first
release — answer "yes" when prompted) or you can supply your own.

## 5. Submit

Either let EAS submit directly:

```
eas submit --platform android --profile production
```

(this uses `eas.json`'s `submit.production.android.track: "internal"` — it
lands in Google Play's **internal testing** track first, not live
production), or download the `.aab` from the EAS build page and upload it
manually in Play Console → your app → Testing → Internal testing.

## 6. Play Console listing

Complete, if not already done:

- **Store listing**: app name, short/full description, screenshots,
  feature graphic, app icon (reuse `apps/mobile/assets/icon.png`).
- **App content**: privacy policy URL, ads declaration (none), content
  rating questionnaire, target audience, data safety form — this app
  collects account email/phone, delivery addresses, and order history, all
  of which should be declared accurately per what `supabase/migrations`
  actually stores.
- **Pricing & distribution**: countries, free app.

Test thoroughly on the internal testing track, then promote the release to
production (staged rollout recommended for a first release — e.g. start at
10–20%).

## 7. Post-release

- Monitor the admin **Dashboard** and **Audit Log** screens for order flow
  and admin activity.
- Watch the Razorpay live dashboard for real payment/refund activity
  alongside the app's own payment reconciliation warnings.
- Watch Supabase's project logs (Dashboard → Logs) for Edge Function
  errors, particularly on `razorpay-webhook` (the one endpoint that's
  publicly reachable without a Supabase session).

## Known gaps to close before (or shortly after) a first production release

These are flagged throughout `IMPLEMENTATION_STATUS.md` per phase; listed
together here since release is when they become decisions rather than
footnotes:

- **No crash-reporting/monitoring service wired in.** `ErrorBoundary`
  (`apps/mobile/src/components/error-boundary.tsx`) only prevents a local
  white-screen crash — nothing is reported anywhere. Wire in Sentry,
  Bugsnag, or Supabase's own log drains before relying on this at scale.
- **Razorpay refund/payment flow is structurally complete but not
  live-tested** against a real Razorpay account — all development and
  verification used Razorpay test mode (and, where even test credentials
  weren't available, direct database-level simulation). Test the full
  checkout → webhook → (if needed) refund path against your live Razorpay
  account during internal testing, before a public rollout.
- **No store-settings admin UI** — delivery fee, tax rate, and
  COD/online toggles are DB-backed and admin-write-RLS'd but only editable
  via the Supabase SQL editor today.
- **No OTA update channel configured** (`expo-updates`/`eas update` are not
  installed) — every change, including small fixes, currently requires a
  new Play Store build/review cycle. Worth adding once the release cadence
  is established.
- **No on-device testing was possible in this development environment**
  (no emulator/physical device access) — every backend workflow was
  verified live against the real Supabase project, and the Expo app build
  itself was verified via `expo export`/`expo-doctor`/`tsc`/`eslint`, but
  the actual on-screen behavior of every screen has not been visually
  confirmed. Budget real device/emulator testing time before a public
  rollout, not just before this first internal build.
