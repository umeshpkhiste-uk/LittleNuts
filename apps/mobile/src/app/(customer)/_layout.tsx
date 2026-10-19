import { Stack } from 'expo-router';

import { GlassHeaderBackground } from '@/components/glass-header-background';
import { useAppTheme } from '@/theme/theme-provider';

export default function CustomerLayout() {
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
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ title: 'Search' }} />
      <Stack.Screen name="category/[id]" options={{ title: 'Category' }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
      <Stack.Screen name="settings/theme" options={{ title: 'Theme' }} />
      <Stack.Screen name="favorites" options={{ title: 'Favorites' }} />
      <Stack.Screen name="legal/help-support" options={{ title: 'Help & Support' }} />
      <Stack.Screen name="legal/privacy-policy" options={{ title: 'Privacy Policy' }} />
      <Stack.Screen name="legal/terms" options={{ title: 'Terms & Conditions' }} />
      <Stack.Screen name="addresses/index" options={{ title: 'Addresses' }} />
      <Stack.Screen name="addresses/new" options={{ title: 'Add Address' }} />
      <Stack.Screen
        name="order/confirmation"
        options={{ title: 'Order Confirmed', headerShown: false }}
      />
      <Stack.Screen name="order/[id]" options={{ title: 'Order Details' }} />
    </Stack>
  );
}
