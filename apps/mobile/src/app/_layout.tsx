import { QueryClientProvider } from '@tanstack/react-query';
import { DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import { ErrorBoundary } from '@/components/error-boundary';
import { useAuthListener } from '@/hooks/use-auth-listener';
import { useRoleSync } from '@/hooks/use-role-sync';
import { queryClient } from '@/lib/query-client';
import { lightPalette } from '@/theme/colors';
import { ThemeProvider, useAppTheme } from '@/theme/theme-provider';
import { glassShadow } from '@/theme/tokens';

// On web, the app otherwise stretches to fill a desktop browser window,
// which doesn't suit a layout designed for phone-width screens. This pins
// it to a phone-sized, centered column (like the native app) with the
// rest of the browser letterboxed in a muted tone — a no-op on native,
// where the screen is already phone width.
const WEB_MAX_WIDTH = 480;

function AppShell({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }
  return (
    <View style={styles.webOuter}>
      <View style={[styles.webFrame, glassShadow]}>{children}</View>
    </View>
  );
}

// React Navigation's own NavigationContainer paints its `colors.background`
// behind every screen *in addition to* our own theme — transparent here
// lets <AppBackground />'s cream fill show through everywhere instead.
const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: 'transparent' },
};

function RootStack() {
  const theme = useAppTheme();
  useAuthListener();
  useRoleSync();

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style="dark" />
      <AppShell>
        <AppBackground />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.background },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="admin" />
        </Stack>
      </AppShell>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <RootStack />
            </ThemeProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: lightPalette.borderStrong,
    // @ts-expect-error -- web-only CSS value, ignored by the native typings
    minHeight: '100vh',
  },
  webFrame: {
    flex: 1,
    width: '100%',
    maxWidth: WEB_MAX_WIDTH,
    overflow: 'hidden',
  },
});
