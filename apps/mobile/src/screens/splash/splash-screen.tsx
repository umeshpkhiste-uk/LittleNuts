import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

// Splash / session-initialization screen (spec section 6, screen 1). Restores
// any persisted Supabase session, then hands off to the customer app. Role
// resolution and admin redirect logic are added in Phase 2 once `user_roles`
// and the role-guard helpers exist.
export function SplashScreen() {
  const theme = useAppTheme();
  const { session, isInitializing, setSession, setInitializing } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return;
        setSession(data.session);
      })
      .catch((error) => {
        console.warn('[splash] failed to restore session', error);
      })
      .finally(() => {
        if (!isMounted) return;
        setInitializing(false);
        setReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, [setSession, setInitializing]);

  if (!ready || isInitializing) {
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

  // Phase 1: no real auth flow yet, always land on the customer shell.
  // Phase 2 adds: session ? role-based redirect : /auth/login
  void session;
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
