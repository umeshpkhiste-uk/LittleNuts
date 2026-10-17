import { Stack } from 'expo-router';

import { GlassHeaderBackground } from '@/components/glass-header-background';
import { useAppTheme } from '@/theme/theme-provider';

export default function AuthLayout() {
  const theme = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerShadowVisible: false,
        headerBackground: () => <GlassHeaderBackground />,
        headerTintColor: theme.textPrimary,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="admin-login" options={{ title: 'Store Admin' }} />
    </Stack>
  );
}
