import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore, type AppRole } from '@/stores/auth-store';

async function fetchRole(userId: string): Promise<AppRole> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[role] failed to fetch role, defaulting to customer', error);
    return 'customer';
  }

  // No row = implicit customer (see supabase/migrations: only admin grants
  // are ever written to user_roles).
  return (data?.role as AppRole | undefined) ?? 'customer';
}

// Mounted once at the app root alongside useAuthListener. Re-derives the
// UI-convenience `role` in the auth store from the trusted user_roles table
// every time the session's user changes — this is the only place client
// code decides "role", and it is always a read of server state, never a
// local default an admin screen could fall back to on its own.
export function useRoleSync() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const setRole = useAuthStore((state) => state.setRole);
  const setRoleLoading = useAuthStore((state) => state.setRoleLoading);

  const { data, isLoading } = useQuery({
    queryKey: ['user-role', userId],
    queryFn: () => fetchRole(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setRoleLoading(false);
      return;
    }
    setRoleLoading(isLoading);
    if (data) {
      setRole(data);
    }
  }, [userId, data, isLoading, setRole, setRoleLoading]);
}
