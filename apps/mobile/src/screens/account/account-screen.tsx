import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { PrimaryButton } from '@/components/primary-button';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
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
  const session = useAuthStore((state) => state.session);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Account</Text>

        {session ? (
          <>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Signed in as {session.user.email ?? session.user.phone}
            </Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Profile editing, addresses, and order history arrive in Phase 3.
            </Text>
            <PrimaryButton title="Sign Out" variant="secondary" onPress={handleSignOut} />
          </>
        ) : (
          <>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              Log in to manage your addresses, place orders, and track deliveries.
            </Text>
            <PrimaryButton title="Log In" onPress={() => router.push('/auth/login')} />
            <PrimaryButton
              title="Create Account"
              variant="secondary"
              onPress={() => router.push('/auth/register')}
            />
          </>
        )}
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
    width: '100%',
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
