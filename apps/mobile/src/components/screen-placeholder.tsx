import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

type ScreenPlaceholderProps = {
  title: string;
  description?: string;
  phase?: string;
};

// Standard placeholder body rendered by routes not yet implemented in the
// current phase. Swapped out for real screen content (from src/screens) as
// each phase lands — the route file itself does not change.
export function ScreenPlaceholder({ title, description, phase }: ScreenPlaceholderProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.textSecondary }]}>{description}</Text>
      ) : null}
      {phase ? (
        <View style={[styles.badge, { borderColor: theme.border }]}>
          <Text style={[styles.badgeText, { color: theme.primary }]}>{phase}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
  },
  description: {
    ...typography.body,
    textAlign: 'center',
  },
  badge: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
});
