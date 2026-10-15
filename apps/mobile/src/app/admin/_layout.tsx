import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';

import { useRequireAdmin } from '@/lib/security/role-guard';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme/theme-provider';

// Client-side gate only — see src/lib/security/README.md. Every table and
// function an admin screen touches is independently protected by RLS /
// private.is_admin() on the backend (supabase/migrations), so this guard
// existing or not changes nothing about what a non-admin can actually do.
export default function AdminLayout() {
  const theme = useAppTheme();
  useRequireAdmin();

  const isInitializing = useAuthStore((state) => state.isInitializing);
  const isRoleLoading = useAuthStore((state) => state.isRoleLoading);
  const role = useAuthStore((state) => state.role);

  if (isInitializing || isRoleLoading || role !== 'admin') {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.background,
        }}
      >
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

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
