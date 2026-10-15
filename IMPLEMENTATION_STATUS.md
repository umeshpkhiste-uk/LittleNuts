# Implementation status

Last updated: 2026-10-15

## Phase 1 — Project foundation: DONE

What was built:

- Repo reorganized: design references moved to `design-assets/`; monorepo
  layout created (`apps/mobile`, `packages/shared`, `supabase/migrations`,
  `supabase/functions`, `tests/{unit,integration,rls}`, `scripts/`).
- Expo app scaffolded in `apps/mobile` (SDK 57, React Native 0.86, React 19,
  TypeScript strict) with Expo Router, `src/` layout (`src/app` routes-only,
  `src/components`, `src/screens`, `src/stores`, `src/lib`, `src/theme`).
- Dependencies installed: `expo-router`, `zustand`, `@tanstack/react-query`,
  `react-hook-form` + `zod` + `@hookform/resolvers`, `@supabase/supabase-js`,
  `expo-secure-store`, `expo-image`, `expo-image-picker`, `expo-notifications`,
  `@react-native-async-storage/async-storage`, `react-native-url-polyfill`,
  `@expo/vector-icons` + `expo-font`, `react-native-reanimated` +
  `react-native-worklets`, `react-native-gesture-handler`,
  `react-native-safe-area-context`, `react-native-screens`.
- Navigation shell wired for every screen named in the master prompt
  (section 6 customer screens + section 14 admin interface), rendering a
  themed placeholder until each phase fills it in:
  - Customer: splash (`/`), bottom tabs (Home, Categories, My Orders, Cart,
    Account), search, product details, cart (tab), addresses, checkout,
    payment processing/result, order confirmation, order details,
    notifications, settings.
  - Auth: login, register, and a deliberately low-visibility **admin login**
    entry point reachable only from a small text link on the Account screen
    (not a menu item) — per the "entry point without exposing admin
    functionality to customers" requirement.
  - Admin: dashboard, orders, products, more — tabs under `/admin`, plus
    order detail / product edit / new-product stack screens. Not yet
    role-guarded (Phase 2).
- Theme: dark/light tokens in `src/theme` matching the design sample's warm
  cream / dark brown / gold palette, with light-mode support.
- Supabase client (`src/lib/supabase/client.ts`) using
  `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` only
  (anon key — never the service role key), with a placeholder fallback so
  the app still boots before Phase 2 provisions a real project.
- `src/stores/auth-store.ts` (Zustand) holding session/role state; role is
  documented as a UI convenience only, never the source of authorization.
- `src/lib/security/README.md` documents the RLS/SECURITY DEFINER
  enforcement model up front, before any guard code exists, so later phases
  build against it correctly.
- `packages/shared/src/money.ts`: paise-based monetary arithmetic
  (`itemSubtotalPaise`, documented rounding rule) per spec section 8 — no
  floating-point rupee math.
- `.env.example` at repo root documenting every required variable and which
  ones are client-safe vs. server-secret-only.
- `app.json` configured: app name "LittleNuts", Android package
  `com.littlenuts.app` (placeholder — confirm before Play Store submission),
  image-picker and notifications permissions/plugins.

Verified (all passing):

- `npx tsc --noEmit` — clean, strict mode.
- `npx expo lint` — clean.
- `npx expo-doctor` — 21/21 checks passed.
- `npx expo export --platform android` — bundle compiles successfully,
  1863 modules resolved, no runtime import errors.

Not yet verified: on-device/emulator boot. No Android SDK/emulator or Xcode
tooling is available in this build environment. Run `npx expo start` and
open on a device/emulator (or `npx expo run:android`) to confirm visually
before moving on, or let me know if you'd like help setting up an emulator.

Deferred / explicitly not done yet (by design, future phases):

- No real authentication, product data, cart, checkout, payment, or admin
  logic — every screen beyond navigation is a placeholder.
- No Supabase project is provisioned; `.env` is not created.
- No automated test suite yet (`tests/` has READMEs only) — test
  infrastructure is introduced alongside the features it covers, starting
  Phase 2.
- App icon/splash still use Expo's default placeholder assets. The provided
  logo (`design-assets/App Logo/Little Nuts Logo.png`) is 1264×842 (not
  square) and would be distorted if used directly as an adaptive icon —
  needs a proper square icon export before Phase 8 (release prep).

## Phase 2 — Supabase & authentication: DONE

Supabase project: **LittleNuts** (`oaslejowibcvprddusbv`, ap-northeast-1).
The Supabase MCP connector hit an environment-specific OAuth bug
("resource must be a valid MCP endpoint") that we couldn't resolve, so this
phase was done via the Supabase CLI instead (`supabase link`, `supabase db
push`, `supabase db advisors`) — see `supabase/README.md`.

What was built:

- Migrations (`supabase/migrations/`): `profiles`, `user_roles`,
  `addresses`, all with RLS enabled. Role model: every user is implicitly
  "customer"; only an explicit `role = 'admin'` row in `user_roles` grants
  admin access, and that table has **no** insert/update/delete policy and
  **no** privileges granted to `anon`/`authenticated` — a role can only be
  assigned via a service-role connection (see `grant_admin_role.sql`).
  `private.is_admin()` is the one SECURITY DEFINER helper later admin
  policies/functions should reuse. A trigger on `auth.users`
  (`on_auth_user_created`) creates each user's profile + default-customer
  role row on signup — the standard Supabase pattern. `supabase db
  advisors` reports zero issues after the schema landed.
- `apps/mobile/.env` created (git-ignored) with the real project URL and
  **publishable** key only — never the service-role/secret key.
- Real auth wiring in the app:
  - `useAuthListener` (mounted once at the root) subscribes to
    `supabase.auth.onAuthStateChange` — single source of session truth,
    covers startup restore and every later sign-in/out.
  - `useRoleSync` re-derives `role` from `user_roles` via TanStack Query
    whenever the session's user changes; never defaults to "customer" by
    assumption without having asked the backend, and exposes an
    `isRoleLoading` flag so the admin guard can't fire on a stale read.
  - `useRequireAdmin` / `/admin/_layout.tsx`: client-side redirect to
    `/auth/admin-login` for non-admins — documented everywhere as UX only,
    not the security boundary (that's RLS + `private.is_admin()`).
  - Login (`/auth/login`): real email/password via
    `signInWithPassword`, plus a structured mobile-OTP tab
    (`signInWithOtp` / `verifyOtp`) that will work as soon as an SMS
    provider is configured in the Supabase dashboard — not simulated,
    just currently unconfigured upstream (per your decision to structure
    it now, wire the provider later).
  - Register (`/auth/register`): real `signUp` with full name in user
    metadata (consumed by the trigger), handles the
    email-confirmation-required case correctly (no session back ⇒ "check
    your email" screen, not a silent fake login).
  - Admin login (`/auth/admin-login`): signs in, then independently
    re-checks the caller's role from `user_roles` before ever navigating
    to `/admin` — signs the session back out immediately if the account
    isn't an admin.
  - Account screen: real signed-in/signed-out state, working "Sign Out".
- `supabase/grant_admin_role.sql`: manual (non-migration) script to
  promote a signed-up user to admin, with placeholder email — documented
  procedure since the two real admin emails aren't in version control.

Verified (all passing):

- `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor` (21/21), `npx expo
  export --platform android` — all clean with the real Supabase env vars
  loaded.
- `supabase db advisors --linked --type all` — no issues.
- End-to-end against the **live** project (via curl + `supabase db
  query`, then cleaned up): signup creates a confirmed-pending user →
  trigger correctly creates `profiles` + `user_roles` (role defaults to
  `customer`) → anonymous REST requests to `profiles`/`user_roles` return
  no rows → an anonymous attempt to INSERT `role: 'admin'` into
  `user_roles` is rejected by RLS (`42501`) → login before email
  confirmation is correctly rejected (`email_not_confirmed`), matching
  the register screen's "check your email" branch.

Not yet verified: the actual screens on-device (same constraint as Phase
1 — no emulator/Xcode in this environment). The backend behavior above was
verified directly against the live database/auth API, but you should run
`npx expo start` and click through login/register/admin-login once to
confirm the UI itself.

Deferred / explicitly not done yet:

- The two real admin accounts are not provisioned — run
  `supabase/grant_admin_role.sql` yourself once they've signed up (needs
  their real emails, which don't belong in this repo).
- Mobile OTP is structurally complete but will error until an SMS
  provider (e.g. Twilio, MSG91) is configured in the Supabase dashboard's
  Auth settings.
- Password recovery ("forgot password") screen is not built yet — not
  blocking for Phase 2's stated deliverable but should land before release
  (flagging for Phase 7 hardening or sooner if you want it now).
- Session-expiration UX (e.g. a friendly re-login prompt vs. a raw error)
  is not specially handled yet — `onAuthStateChange` will surface a
  `SIGNED_OUT` event on expiry, which currently just routes like any
  other sign-out.

## Phase 3 — Product catalog & cart: DONE

What was built:

- Migration (`20261015190150_catalog_and_cart.sql`): `categories`, `products`,
  `carts`, `cart_items`, all with RLS, plus a `product-images` Storage
  bucket (public read, admin-only write). Catalog is publicly browsable —
  anon and authenticated both see active categories/products; writes are
  admin-only via `private.is_admin()`. Carts are per-user (one cart per
  user, lazily upserted) and require authentication; `cart_items` ownership
  is enforced via a join back to `carts.user_id`. Adding to cart never
  touches `products.stock_weight_g` (spec section 9 — cart is not a stock
  reservation).
- `supabase/seed.sql`: the 10 starter categories from spec section 3 plus
  11 sample products (illustrative pricing/stock), idempotent. Not
  "hardcoding the catalog" — every row is a normal, fully admin-editable
  row, just a reasonable starting point.
- `packages/shared` is now actually wired into the app (`@littlenuts/shared`
  via a `file:` dependency + npm symlink — confirmed Metro resolves it fine
  without extra monorepo config) and extended with `weight.ts`
  (`formatWeight`, `clampToIncrement`, `isValidQuantity`) and `types.ts`
  (`Category`, `Product`, `CartItem` row shapes).
- Customer: Home (categories row + featured products), Categories tab,
  category product listing (new route), Search (text + category filter),
  Product Details (image, weight presets filtered to the product's
  min/max/increment, custom-grams input, live price via
  `itemSubtotalPaise`, add-to-cart that redirects to login if signed out),
  and a real Cart tab (quantity steppers, remove, subtotal, persisted via
  `carts`/`cart_items`).
- Admin: Products tab (search, stock/active/featured badges), new/edit
  product form (category picker, pricing in ₹ converted to paise, weight
  rules, stock, reorder threshold, active/featured toggles, image upload
  via `expo-image-picker` → `expo-file-system`'s `File.arrayBuffer()` →
  Supabase Storage), and a lightweight Categories screen (add category,
  toggle active) reachable from the admin "More" tab, which also now has a
  working Sign Out.

Verified (all passing):

- `npx tsc --noEmit`, `npx expo lint`, `npx expo-doctor` (21/21), `npx expo
  export --platform android` — all clean.
- `supabase db advisors --linked --type all` — no issues.
- Live backend checks: anonymous REST reads return the real seeded
  categories/products; an anonymous attempt to INSERT a product is
  rejected by RLS (`42501`); anonymous reads of `carts`/`cart_items`
  return nothing. Cart RLS was exercised directly in Postgres (two real
  `auth.users` rows created solely for the test, `request.jwt.claims` /
  `role authenticated` simulated per the Postgres RLS testing pattern):
  confirmed a user can read/write only their own cart, cannot see another
  user's `cart_items` (the join-based ownership policy), and that a
  non-admin authenticated user's attempt to change a product's price
  silently matches zero rows (RLS filters it out, not an exception —
  price confirmed unchanged) rather than succeeding. Test rows cleaned up
  after.
- Could not re-run the full signup→login flow end-to-end via the REST API
  this phase (Supabase's default email provider hit its send-rate-limit
  after Phase 2's test), hence the direct-SQL RLS simulation above as the
  verification path instead.

Not yet verified: the actual screens on-device (same constraint as prior
phases). Run `npx expo start` and browse the seeded catalog, add to cart,
and try the admin product form (once an admin account is set up per
`supabase/grant_admin_role.sql`) to confirm the UI itself.

Deferred / explicitly not done yet:

- Price/stock revalidation at checkout and "price changed, confirm?" UX
  (spec section 8) — lands with Phase 4's checkout flow, since it's
  meaningless without an order to check against.
- Sorting and availability/price-range filters on Search are not built —
  only text + category filter. Worth adding if you want richer discovery
  before Phase 8, but not blocking later phases.
- Multiple product images (gallery) — the form currently uploads a single
  image into `image_urls[0]`.
- Admin category editing (rename, reorder, delete, image) beyond
  create/toggle-active — same reasoning as above, not blocking.

## Phase 4 — Checkout & payments: NOT STARTED

## Phase 5 — Admin order management: NOT STARTED

## Phase 6 — Inventory & synchronization: NOT STARTED

## Phase 7 — Refunds & production hardening: NOT STARTED

## Phase 8 — Release: NOT STARTED
