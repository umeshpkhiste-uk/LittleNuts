import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { PrimaryButton } from '@/components/primary-button';
import { supabase } from '@/lib/supabase/client';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function AdminMoreScreen() {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.textPrimary }]}>More</Text>

      <Pressable
        onPress={() => router.push('/admin/categories')}
        style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
      >
        <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Categories</Text>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </Pressable>

      <Text style={[styles.note, { color: theme.textSecondary }]}>
        Store configuration, delivery zones, and the admin audit log arrive in later phases.
      </Text>

      <PrimaryButton
        title="Sign Out"
        variant="secondary"
        onPress={() => void supabase.auth.signOut()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  rowLabel: {
    ...typography.bodyStrong,
  },
  note: {
    ...typography.caption,
  },
});
