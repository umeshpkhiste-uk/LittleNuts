import { Stack } from 'expo-router';

import { useAppTheme } from '@/theme/theme-provider';

// Phase 2 wraps this layout with a role guard (src/lib/security) that
// redirects to /auth/admin-login unless the authenticated user's role,
// as resolved from the trusted `user_roles` table, is "admin". Every
// screen under /admin also assumes server-side authorization on top of
// this client-side gate (RLS + SECURITY DEFINER functions) — this guard
// only improves navigation UX, per src/lib/security/README.md.
export default function AdminLayout() {
  const theme = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.textPrimary,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Order Details' }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Edit Product' }} />
      <Stack.Screen name="product/new" options={{ title: 'New Product' }} />
    </Stack>
  );
}
