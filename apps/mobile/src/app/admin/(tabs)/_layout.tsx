import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { GlassTabBarBackground } from '@/components/glass-tab-bar-background';
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

export default function AdminTabsLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: { backgroundColor: 'transparent', borderTopWidth: 0, elevation: 0 },
        tabBarBackground: () => <GlassTabBarBackground />,
        sceneStyle: { backgroundColor: theme.backgroundSolid },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: tabIcon('speedometer', 'speedometer-outline') }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: tabIcon('file-tray-full', 'file-tray-full-outline') }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: 'Products', tabBarIcon: tabIcon('cube', 'cube-outline') }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'More', tabBarIcon: tabIcon('ellipsis-horizontal', 'ellipsis-horizontal-outline') }}
      />
    </Tabs>
  );
}
