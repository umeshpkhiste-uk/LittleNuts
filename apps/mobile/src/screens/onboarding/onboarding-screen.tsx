import { useMemo } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setOnboardingComplete } from '@/lib/onboarding';
import { supabase } from '@/lib/supabase/client';
import type { AppTheme } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

// First-run welcome screen (shown once — see src/lib/onboarding.ts for the
// AsyncStorage flag). Reads the same app theme as everywhere else (see
// src/theme/colors.ts) so its Continue button and accents stay in sync
// with the rest of the app's brand color instead of a separately
// hand-picked palette.
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const COLORS = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  async function handleContinue() {
    await setOnboardingComplete();
    const { data } = await supabase.auth.getSession();
    router.replace(data.session ? '/(customer)/(tabs)' : '/auth/login');
  }

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background, paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>ONBOARDING • WELCOME</Text>
        </View>
        <Pressable onPress={handleContinue} hitSlop={8}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      <View style={[styles.card, { height: SCREEN_HEIGHT * 0.42 }]}>
        <Image
          source={require('../../../assets/onboarding-logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </View>

      <View style={styles.dotsRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      <Text style={styles.title}>Welcome to LittleNuts</Text>
      <Text style={styles.subtitle}>
        Embark on a culinary journey with handpicked whole harvest, farm-fresh dry fruits & super
        seeds delivered right to your door.
      </Text>

      <View style={styles.spacer} />

      <Pressable
        onPress={handleContinue}
        style={[styles.cta, { marginBottom: Math.max(insets.bottom, spacing.lg) }]}
      >
        <Text style={styles.ctaLabel}>Continue</Text>
        <Ionicons name="arrow-forward" size={18} color={COLORS.primaryText} />
      </Pressable>

      <Link href="/auth/login" asChild>
        <Text
          style={StyleSheet.flatten([
            styles.footer,
            { marginBottom: Math.max(insets.bottom, spacing.lg) },
          ])}
        >
          Already have an account? <Text style={styles.footerLink}>Sign In</Text>
        </Text>
      </Link>
    </View>
  );
}

const createStyles = (COLORS: AppTheme) =>
  StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: COLORS.badgeBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: COLORS.badgeDot,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: COLORS.badgeText,
  },
  skip: {
    ...typography.body,
    color: COLORS.subtitle,
  },
  card: {
    marginTop: spacing.xl,
    backgroundColor: COLORS.card,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  logo: {
    width: '92%',
    aspectRatio: 1264 / 854,
  },
  spacer: {
    flex: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: COLORS.borderStrong,
  },
  dotActive: {
    width: 20,
    backgroundColor: COLORS.primary,
  },
  title: {
    ...typography.display,
    textAlign: 'center',
    marginTop: spacing.xl,
    color: COLORS.heading,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    color: COLORS.subtitle,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: COLORS.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  ctaLabel: {
    ...typography.bodyStrong,
    color: COLORS.primaryText,
  },
  footer: {
    ...typography.body,
    textAlign: 'center',
    color: COLORS.subtitle,
  },
  footerLink: {
    fontWeight: '700',
    color: COLORS.heading,
  },
});
