import { useEffect } from 'react';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

// Mounted once at the app root. Supabase fires an initial "INITIAL_SESSION"
// event with the restored session (or null) as soon as the listener is
// attached, so this single subscription covers both startup restoration and
// every later sign-in/sign-out/token-refresh — no separate getSession() call
// needed elsewhere.
export function useAuthListener() {
  const setSession = useAuthStore((state) => state.setSession);
  const setInitializing = useAuthStore((state) => state.setInitializing);
  const signOutLocal = useAuthStore((state) => state.signOutLocal);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        signOutLocal();
      } else {
        setSession(session);
      }
      setInitializing(false);
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [setSession, setInitializing, signOutLocal]);
}
