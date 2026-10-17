import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import { getOnboardingComplete } from '@/lib/onboarding';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

// Splash / session-initialization screen (spec section 6, screen 1). Session
// restoration itself happens once, at the root, via useAuthListener — this
// screen just waits for that to settle (and for the one-time onboarding
// flag to load) and then hands off to either the first-run welcome screen
// or the customer shell. Signed-in customers and admins both land in the
// customer app by default; admins reach /admin explicitly via the Account
// screen's admin login link, never an automatic redirect on launch.
export function SplashScreen() {
  const theme = useAppTheme();
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean | null>(null);

  useEffect(() => {
    getOnboardingComplete().then(setOnboardingCompleteState);
  }, []);

  if (isInitializing || onboardingComplete === null) {
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

  return <Redirect href="/(customer)/(tabs)" />;
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
