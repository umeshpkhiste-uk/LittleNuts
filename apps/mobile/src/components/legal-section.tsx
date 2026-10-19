import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

// Shared layout for the static content screens under Settings (Help &
// Support, Privacy Policy, Terms & Conditions) — just a heading + a list of
// paragraphs per section, themed from the active app theme.
export function LegalSection({ title, paragraphs }: { title: string; paragraphs: string[] }) {
  const theme = useAppTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={[styles.body, { color: theme.textSecondary }]}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.xs,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 16,
  },
  body: {
    ...typography.body,
    lineHeight: 20,
  },
});
