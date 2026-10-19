import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme, useThemeMode } from '@/theme/theme-provider';
import type { ThemeMode } from '@/theme/theme-store';
import { radius, spacing, typography } from '@/theme/tokens';

const OPTIONS: { mode: ThemeMode; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    mode: 'light',
    label: 'Light',
    description: 'The cream and forest-green look, always on.',
    icon: 'sunny-outline',
  },
  {
    mode: 'dark',
    label: 'Dark',
    description: 'The original dark glass look, always on.',
    icon: 'moon-outline',
  },
  {
    mode: 'auto',
    label: 'Auto',
    description: "Follows your device's system appearance.",
    icon: 'phone-portrait-outline',
  },
];

export function ThemeScreen() {
  const theme = useAppTheme();
  const { mode, effective, setMode } = useThemeMode();

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <Text style={[styles.hint, { color: theme.textSecondary }]}>
        Currently showing: {effective === 'light' ? 'Light' : 'Dark'}
      </Text>
      {OPTIONS.map((option) => {
        const active = mode === option.mode;
        return (
          <Pressable
            key={option.mode}
            onPress={() => setMode(option.mode)}
            style={[
              styles.option,
              { backgroundColor: theme.card, borderColor: active ? theme.primary : theme.border },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: theme.surface }]}>
              <Ionicons name={option.icon} size={18} color={theme.textPrimary} />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>{option.label}</Text>
              <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                {option.description}
              </Text>
            </View>
            <Ionicons
              name={active ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={active ? theme.primary : theme.textSecondary}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  hint: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...typography.bodyStrong,
  },
  optionDescription: {
    ...typography.caption,
  },
});
