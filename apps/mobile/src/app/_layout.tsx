import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppBackground } from '@/components/app-background';
import { ErrorBoundary } from '@/components/error-boundary';
import { useAuthListener } from '@/hooks/use-auth-listener';
import { useRoleSync } from '@/hooks/use-role-sync';
import { queryClient } from '@/lib/query-client';
import { ThemeProvider, useAppTheme } from '@/theme/theme-provider';

// React Navigation's own NavigationContainer paints its `colors.background`
// behind every screen *in addition to* our own theme — left on the stock
// DefaultTheme, that's an opaque rgb(242,242,242) sitting on top of
// <AppBackground />, which is exactly the flat light-gray wash that was
// hiding it. Transparent here lets AppBackground show through everywhere.
const navigationTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: 'transparent' },
};

function RootStack() {
  const theme = useAppTheme();
  useAuthListener();
  useRoleSync();

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <AppBackground />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="admin" />
      </Stack>
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
