import { ScreenPlaceholder } from '@/components/screen-placeholder';

// Admin login entry point (spec section 5: "Admin login" / section 6).
// Reachable only via the low-visibility link on the customer Account screen.
// Phase 2 wires this to Supabase Auth + a trusted backend role check — only
// the two provisioned administrator accounts will ever reach /admin.
export default function AdminLogin() {
  return (
    <ScreenPlaceholder
      title="Store Admin Login"
      description="Authorized administrators only."
      phase="Arrives in Phase 2"
    />
  );
}
