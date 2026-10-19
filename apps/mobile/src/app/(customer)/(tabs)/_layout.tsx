import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/custom-tab-bar';
import { useFavorites } from '@/hooks/favorites/use-favorites';
import { useAppTheme } from '@/theme/theme-provider';

export default function CustomerTabsLayout() {
  const theme = useAppTheme();
  const favorites = useFavorites();
  const favoritesCount = favorites.data?.length ?? 0;

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
        name="favorites"
        options={{
          title: 'Favorite',
          tabBarBadge: favoritesCount > 0 ? favoritesCount : undefined,
        }}
      />
      <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
      <Tabs.Screen name="account" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
