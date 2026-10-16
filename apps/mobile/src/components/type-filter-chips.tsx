import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { palette } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export type FilterGroup = 'all' | 'nuts' | 'seeds' | 'dried-fruits' | 'mixes';

const OPTIONS: { key: FilterGroup; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'grid' },
  { key: 'nuts', label: 'Nuts', icon: 'nutrition-outline' },
  { key: 'seeds', label: 'Seeds', icon: 'leaf-outline' },
  { key: 'dried-fruits', label: 'Dried Fruits', icon: 'flower-outline' },
  { key: 'mixes', label: 'Mixes', icon: 'shuffle-outline' },
];

export function TypeFilterChips({
  value,
  onChange,
}: {
  value: FilterGroup;
  onChange: (group: FilterGroup) => void;
}) {
  const theme = useAppTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {OPTIONS.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            style={styles.item}
            hitSlop={4}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  borderColor: active ? palette.gold : theme.border,
                  backgroundColor: active ? 'rgba(232,163,61,0.16)' : theme.surface,
                },
              ]}
            >
              <Ionicons
                name={option.icon}
                size={20}
                color={active ? palette.gold : theme.textSecondary}
              />
            </View>
            <Text
              numberOfLines={2}
              style={[styles.label, { color: active ? palette.gold : theme.textSecondary }]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.md,
    paddingRight: spacing.md,
  },
  item: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 76,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
});
