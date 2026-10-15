import { useEffect } from 'react';
import { router } from 'expo-router';

import { useAuthStore } from '@/stores/auth-store';

/**
 * Client-side navigation guard for the /admin route group. This only
 * improves UX (bounces a non-admin out before they see admin screens) — it
 * is NOT the security boundary. Every admin-only table/function is also
 * protected by RLS + the private.is_admin() check (see
 * supabase/migrations), so a customer who bypasses this guard entirely
 * (e.g. by deep-linking) still cannot read or write anything privileged.
 * See src/lib/security/README.md.
 */
export function useRequireAdmin() {
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const isRoleLoading = useAuthStore((state) => state.isRoleLoading);
  const session = useAuthStore((state) => state.session);
  const role = useAuthStore((state) => state.role);

  useEffect(() => {
    if (isInitializing || isRoleLoading) return;
    if (!session || role !== 'admin') {
      router.replace('/auth/admin-login');
    }
  }, [isInitializing, isRoleLoading, session, role]);
}
