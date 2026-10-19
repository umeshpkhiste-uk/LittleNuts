import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useAppTheme, useThemeMode } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

const THEME_LABEL: Record<string, string> = {
  light: 'Light',
  dark: 'Dark',
  auto: 'Auto',
};

export function SettingsScreen() {
  const theme = useAppTheme();
  const { mode } = useThemeMode();

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <SettingsRow
        icon="notifications-outline"
        label="Notifications"
        onPress={() => router.push('/notifications')}
      />
      <SettingsRow
        icon="color-palette-outline"
        label="Theme"
        value={THEME_LABEL[mode]}
        onPress={() => router.push('/settings/theme')}
      />
      <SettingsRow
        icon="help-circle-outline"
        label="Help & Support"
        onPress={() => router.push('/legal/help-support')}
      />
      <SettingsRow
        icon="shield-checkmark-outline"
        label="Privacy Policy"
        onPress={() => router.push('/legal/privacy-policy')}
      />
      <SettingsRow
        icon="document-text-outline"
        label="Terms & Conditions"
        onPress={() => router.push('/legal/terms')}
      />
    </ScrollView>
  );
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <Ionicons name={icon} size={18} color={theme.textPrimary} />
      <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>{label}</Text>
      {value ? <Text style={[styles.rowValue, { color: theme.textSecondary }]}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  rowLabel: {
    ...typography.bodyStrong,
    fontSize: 14,
    flex: 1,
  },
  rowValue: {
    ...typography.caption,
  },
});
