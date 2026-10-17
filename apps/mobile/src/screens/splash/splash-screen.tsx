import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import { getOnboardingComplete } from '@/lib/onboarding';
import { clearSavedCredentials, getSavedCredentials } from '@/lib/saved-credentials';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

type ResolvedDestination = 'home' | 'login' | null;

// Splash / session-initialization screen (spec section 6, screen 1). Session
// restoration itself happens once, at the root, via useAuthListener — this
// screen just waits for that to settle (and for the one-time onboarding
// flag to load) and then hands off to one of three destinations:
//
// - First run (onboarding not complete yet) -> the welcome screen.
// - Returning, "Save password" was on last time -> silently re-authenticate
//   with the saved credentials and go straight to the customer shell.
// - Returning, "Save password" was off -> always land on Log In, even if
//   Supabase still has a persisted session from before (signed out here so
//   the rest of the app's session-based gating stays consistent with what's
//   on screen) — "Save password" is the only thing that keeps a user signed
//   in across a full app restart.
//
// Signed-in customers and admins both land in the customer app; admins
// reach /admin explicitly via the Account screen's admin login link, never
// an automatic redirect on launch.
export function SplashScreen() {
  const theme = useAppTheme();
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const session = useAuthStore((state) => state.session);
  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean | null>(null);
  const [resolvedDestination, setResolvedDestination] = useState<ResolvedDestination>(null);

  useEffect(() => {
    getOnboardingComplete().then(setOnboardingCompleteState);
  }, []);

  // Only the "onboarding already complete" case needs the async
  // saved-credentials / session check below; the first-run and
  // still-loading cases are handled directly in the render below.
  const needsSessionResolution = !isInitializing && onboardingComplete === true;

  useEffect(() => {
    if (!needsSessionResolution) return;

    let cancelled = false;

    (async () => {
      const saved = await getSavedCredentials();

      if (saved) {
        if (!session) {
          const { error } = await supabase.auth.signInWithPassword(saved);
          if (error) {
            // Saved credentials no longer work (password changed elsewhere,
            // account removed, etc.) — drop them and fall back to the form.
            await clearSavedCredentials();
            if (!cancelled) setResolvedDestination('login');
            return;
          }
        }
        if (!cancelled) setResolvedDestination('home');
        return;
      }

      if (session) {
        await supabase.auth.signOut();
      }
      if (!cancelled) setResolvedDestination('login');
    })();

    return () => {
      cancelled = true;
    };
  }, [needsSessionResolution, session]);

  const stillDeciding =
    isInitializing || onboardingComplete === null || (needsSessionResolution && !resolvedDestination);

  if (stillDeciding) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: theme.textPrimary }]}>LittleNuts</Text>
        <ActivityIndicator color={theme.primary} style={styles.spinner} />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  if (resolvedDestination === 'home') {
    return <Redirect href="/(customer)/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 96,
    height: 96,
  },
  title: {
    ...typography.display,
  },
  spinner: {
    marginTop: spacing.lg,
  },
});
