import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

// Customer "Profile and settings" screen (spec section 6, screen 14). Also
// hosts the one deliberately low-visibility entry point into the admin
// interface (spec section 6: "Provide an entry point to admin login without
// exposing admin functionality to customers") — a small text link, not a
// menu item, with no indication of admin capability for a signed-in
// customer who isn't looking for it.
export function AccountScreen() {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Account</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Profile, addresses, and notifications will appear here once authentication is wired up
          in Phase 2.
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/auth/admin-login')}
        hitSlop={8}
        style={styles.adminLink}
      >
        <Text style={[styles.adminLinkText, { color: theme.textSecondary }]}>Store Admin</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.xl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
  },
  description: {
    ...typography.body,
    textAlign: 'center',
  },
  adminLink: {
    alignSelf: 'center',
    paddingVertical: spacing.md,
  },
  adminLinkText: {
    ...typography.caption,
  },
});
