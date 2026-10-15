import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';

export type AppRole = 'customer' | 'admin';

type AuthState = {
  session: Session | null;
  role: AppRole | null;
  isInitializing: boolean;
  setSession: (session: Session | null) => void;
  setRole: (role: AppRole | null) => void;
  setInitializing: (value: boolean) => void;
  signOutLocal: () => void;
};

// Client-side auth state cache only. The customer/admin `role` value here is a
// convenience for navigation/UI — it is always re-derived from the trusted
// `user_roles` table (via RLS + a server-validated query) on session change,
// never trusted on its own to gate a privileged database write. See
// src/lib/security/role-guard.ts (added in Phase 2) for the enforcement point.
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  role: null,
  isInitializing: true,
  setSession: (session) => set({ session }),
  setRole: (role) => set({ role }),
  setInitializing: (value) => set({ isInitializing: value }),
  signOutLocal: () => set({ session: null, role: null }),
}));
