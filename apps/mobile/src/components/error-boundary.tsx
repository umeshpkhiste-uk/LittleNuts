import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { lightPalette } from '@/theme/colors';
import { spacing, typography } from '@/theme/tokens';

type Props = { children: ReactNode };
type State = { error: Error | null };

// Render-time crash safety net (spec section 25: "error handling"). No
// crash-reporting service is wired up here — there's no Sentry/Bugsnag
// DSN available in this environment — so this only prevents a white
// screen and lets the person retry; wiring one in is a release-blocker
// documented in IMPLEMENTATION_STATUS.md, not something simulated here.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('Unhandled render error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error.message || 'An unexpected error occurred.'}
          </Text>
          <PrimaryButton title="Try Again" onPress={() => this.setState({ error: null })} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: lightPalette.cream,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    color: lightPalette.heading,
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    color: lightPalette.subtitle,
  },
});
