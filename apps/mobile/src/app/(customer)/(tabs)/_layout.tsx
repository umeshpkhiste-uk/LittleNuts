import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { GlassTabBarBackground } from '@/components/glass-tab-bar-background';
import { useCart } from '@/hooks/cart/use-cart';
import { palette } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';

type IconName = keyof typeof Ionicons.glyphMap;

function tabIcon(active: IconName, inactive: IconName) {
  function TabIcon({
    focused,
    color,
    size,
  }: {
    focused: boolean;
    color: ColorValue;
    size: number;
  }) {
    return <Ionicons name={focused ? active : inactive} color={color as string} size={size} />;
  }
  return TabIcon;
}

export default function CustomerTabsLayout() {
  const theme = useAppTheme();
  const cart = useCart();
  const cartCount = cart.data?.items.length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: { backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
        tabBarBackground: () => <GlassTabBarBackground />,
        // Bottom tabs keep every tab's scene mounted and stacked at the
        // same position; with a transparent background (the app-wide
        // default, see AppBackground) the inactive tabs behind the active
        // one would bleed through. An opaque scene background per tab
        // avoids that — the glow blobs still show on Stack screens
        // (product detail, checkout, etc.), just not stacked behind tabs.
        sceneStyle: { backgroundColor: theme.backgroundSolid },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tabs.Screen
        name="categories"
        options={{ title: 'Categories', tabBarIcon: tabIcon('grid', 'grid-outline') }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'My Orders', tabBarIcon: tabIcon('receipt', 'receipt-outline') }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: tabIcon('cart', 'cart-outline'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: palette.gold, color: palette.navyBase },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{ title: 'Account', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tabs>
  );
}
