import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LightInput } from '@/components/light-form-input';
import { goBack } from '@/lib/go-back';
import { showAlert } from '@/lib/show-alert';
import { supabase } from '@/lib/supabase/client';
import { registerSchema, type RegisterInput } from '@/lib/validation/auth';
import type { AppTheme } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

// Light, cream-and-forest-green look shared with the welcome and sign-in
// screens (see src/theme/colors.ts) — matches the brand
// mockup at design-assets/App Design/stitch_littlenuts_dryfruit_shopping_app/
// littlenuts_register_screen/screen.png.
export function RegisterScreen() {
  const COLORS = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.fullName } },
    });
    setIsSubmitting(false);
    if (error) {
      setFormError(error.message);
      return;
    }

    // If email confirmation is required (the Supabase default), there is no
    // session yet — show a "check your email" state instead of navigating
    // into the app as if signed in.
    if (!data.session) {
      setConfirmationSent(true);
      return;
    }

    router.replace('/(customer)/(tabs)');
  }

  function onGoogleContinue() {
    showAlert('Coming soon', 'Continue with Google will be available in a future update.');
  }

  if (confirmationSent) {
    return (
      <View style={[styles.confirmContainer, { backgroundColor: COLORS.background }]}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={[styles.subtitle, { textAlign: 'center' }]}>
          We&apos;ve sent a confirmation link to your email address. Verify it, then sign in.
        </Text>
        <Link href="/auth/login" asChild>
          <Text style={styles.footerLink}>Back to Sign In</Text>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: COLORS.background, paddingTop: insets.top + spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <Pressable onPress={() => goBack()} hitSlop={8} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={COLORS.heading} />
          </Pressable>
          <View style={styles.badge}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>AUTH • REGISTER</Text>
          </View>
        </View>

        <View style={styles.heading}>
          <Text style={styles.title}>Register Now</Text>
          <Text style={styles.subtitle}>
            Begin your healthy journey and get access to fresh handpicked dry fruits, organic
            superfoods and artisanal harvest.
          </Text>
        </View>

        {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}

        <View style={styles.form}>
          <Controller
            control={form.control}
            name="fullName"
            render={({ field, fieldState }) => (
              <LightInput
                placeholder="Full Name"
                icon="person-outline"
                autoCapitalize="words"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <LightInput
                placeholder="Email Address"
                icon="mail-outline"
                autoCapitalize="none"
                keyboardType="email-address"
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <LightInput
                placeholder="Password"
                icon="lock-closed-outline"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <LightInput
                placeholder="Confirm Password"
                icon="lock-closed-outline"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <Pressable onPress={form.handleSubmit(onSubmit)} disabled={isSubmitting} style={styles.cta}>
            <Text style={styles.ctaLabel}>
              {isSubmitting ? 'Creating Account…' : 'Create Account'}
            </Text>
            {!isSubmitting ? <Ionicons name="arrow-forward" size={18} color={COLORS.accent} /> : null}
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable onPress={onGoogleContinue} style={styles.socialButton}>
          <Ionicons name="logo-google" size={18} color={COLORS.heading} />
          <Text style={styles.socialLabel}>Continue with Google</Text>
        </Pressable>

        <Text style={[styles.footer, { marginBottom: Math.max(insets.bottom, spacing.lg) }]}>
          Already have an account?{' '}
          <Link href="/auth/login" asChild>
            <Text style={styles.footerLink}>Sign In.</Text>
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (COLORS: AppTheme) =>
  StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  confirmContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
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
  heading: {
    gap: spacing.sm,
  },
  title: {
    ...typography.display,
    color: COLORS.heading,
  },
  subtitle: {
    ...typography.body,
    color: COLORS.subtitle,
  },
  form: {
    gap: spacing.md,
  },
  errorBanner: {
    ...typography.body,
    color: COLORS.forgot,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: COLORS.button,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  ctaLabel: {
    ...typography.bodyStrong,
    color: COLORS.primaryText,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    ...typography.caption,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: COLORS.subtitle,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  socialLabel: {
    ...typography.bodyStrong,
    color: COLORS.heading,
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
