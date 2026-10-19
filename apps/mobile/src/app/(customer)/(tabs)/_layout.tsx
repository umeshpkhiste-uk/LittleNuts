import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/custom-tab-bar';
import { useCart } from '@/hooks/cart/use-cart';
import { useAppTheme } from '@/theme/theme-provider';

export default function CustomerTabsLayout() {
  const theme = useAppTheme();
  const cart = useCart();
  const cartCount = cart.data?.items.length ?? 0;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Bottom tabs keep every tab's scene mounted and stacked at the
        // same position; with a transparent background (the app-wide
        // default, see AppBackground) the inactive tabs behind the active
        // one would bleed through. An opaque scene background per tab
        // avoids that.
        sceneStyle: { backgroundColor: theme.backgroundSolid },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="categories" options={{ title: 'Menu' }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
        }}
      />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="account" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
