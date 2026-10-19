import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';

import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  categories: { active: 'grid', inactive: 'grid-outline' },
  favorites: { active: 'heart', inactive: 'heart-outline' },
  orders: { active: 'receipt', inactive: 'receipt-outline' },
  account: { active: 'person', inactive: 'person-outline' },
};

// A floating pill-shaped tab bar with the Cart tab raised into its own
// circular, accent-colored button that pokes above the bar — matches the
// brand mockup's bottom-navigation style. Everything else (which 5 tabs,
// what they do) is unchanged; this only replaces how the bar is drawn.
export function CustomTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View
        style={[
          styles.bar,
          { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.heading },
        ]}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            typeof options.title === 'string' ? options.title : (route.name as string);
          const isFocused = state.index === index;
          const icons = TAB_ICONS[route.name] ?? TAB_ICONS.index;
          const isRaised = route.name === 'favorites';
          const badge = options.tabBarBadge;

          function onPress() {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          }

          const tintColor = isFocused ? theme.primary : theme.textSecondary;

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.item}>
              {isRaised ? (
                <View style={[styles.raisedButton, { backgroundColor: theme.primary }]}>
                  <Ionicons name={icons.active} size={24} color={theme.primaryText} />
                  {badge ? (
                    <View style={[styles.badge, { backgroundColor: theme.forgot }]}>
                      <Text style={styles.badgeText}>{badge}</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <Ionicons name={isFocused ? icons.active : icons.inactive} size={22} color={tintColor} />
              )}
              <Text numberOfLines={1} style={[styles.label, { color: tintColor }]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  label: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
  },
  raisedButton: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
