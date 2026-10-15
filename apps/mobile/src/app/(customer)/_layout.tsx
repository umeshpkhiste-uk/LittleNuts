import { Stack } from 'expo-router';

import { useAppTheme } from '@/theme/theme-provider';

export default function CustomerLayout() {
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
      <Stack.Screen name="search" options={{ title: 'Search' }} />
      <Stack.Screen name="product/[id]" options={{ title: 'Product' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="addresses/index" options={{ title: 'Addresses' }} />
      <Stack.Screen name="addresses/new" options={{ title: 'Add Address' }} />
      <Stack.Screen name="payment/processing" options={{ title: 'Payment', headerShown: false }} />
      <Stack.Screen name="payment/result" options={{ title: 'Payment Result', headerShown: false }} />
      <Stack.Screen
        name="order/confirmation"
        options={{ title: 'Order Confirmed', headerShown: false }}
      />
      <Stack.Screen name="order/[id]" options={{ title: 'Order Details' }} />
    </Stack>
  );
}
