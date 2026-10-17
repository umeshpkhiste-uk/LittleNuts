import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/primary-button';
import { setOnboardingComplete } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase/client';
import { useAppTheme } from '@/theme/theme-provider';
import { glassShadow, radius, spacing, typography } from '@/theme/tokens';

// First-run welcome screen (shown once, before the customer learns to rely
// on AsyncStorage having a 'littlenuts:onboarding-complete' flag — see
// src/lib/onboarding.ts). Mirrors the brand's reference mockup: a logo card
// filling the upper half, a dark panel below with headline/copy/CTA. Routed
// to from SplashScreen only when that flag is unset; "Get Started" sets it
// and hands off to the customer tab shell.
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function OnboardingScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  async function handleGetStarted() {
    await setOnboardingComplete();
    const { data } = await supabase.auth.getSession();
    router.replace(data.session ? '/(customer)/(tabs)' : '/auth/register');
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.logoPanel, { height: SCREEN_HEIGHT * 0.52 }]}>
        <LinearGradient
          colors={['#F6ECD9', '#EBDAB8', '#DDC08C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['rgba(232,163,61,0.35)', 'rgba(232,163,61,0)']}
          style={styles.glowTopRight}
        />
        <LinearGradient
          colors={['rgba(138,90,42,0.3)', 'rgba(138,90,42,0)']}
          style={styles.glowBottomLeft}
        />
        <Image
          source={require('../../../assets/onboarding-logo.png')}
          style={[styles.logo, glassShadow]}
          contentFit="contain"
        />
      </View>

      <View style={styles.bottomPanel}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive, { backgroundColor: theme.primary }]} />
          <View style={[styles.dot, { backgroundColor: theme.border }]} />
          <View style={[styles.dot, { backgroundColor: theme.border }]} />
        </View>

        <Text style={[styles.title, { color: theme.textPrimary }]}>Welcome to Little Nuts</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          A premium range of handpicked nuts, seeds & dried fruits — 100% natural, healthy, and
          delivered fresh to your door.
        </Text>

        <PrimaryButton
          title="Get Started"
          onPress={handleGetStarted}
          style={[styles.cta, { marginBottom: Math.max(insets.bottom, spacing.lg) }]}
        />
      </View>
    </View>
  );
}

const GLOW = 320;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoPanel: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowTopRight: {
    position: 'absolute',
    width: GLOW,
    height: GLOW,
    borderRadius: GLOW / 2,
    top: -GLOW * 0.4,
    right: -GLOW * 0.3,
  },
  glowBottomLeft: {
    position: 'absolute',
    width: GLOW,
    height: GLOW,
    borderRadius: GLOW / 2,
    bottom: -GLOW * 0.45,
    left: -GLOW * 0.4,
  },
  logo: {
    width: '86%',
    aspectRatio: 1264 / 854,
    borderRadius: radius.lg,
  },
  bottomPanel: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  dotActive: {
    width: 20,
  },
  title: {
    ...typography.display,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  cta: {
    width: '100%',
    marginTop: 'auto',
  },
});
