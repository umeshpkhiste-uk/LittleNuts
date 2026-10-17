import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setHasAccount } from '@/lib/account-history';
import { goBack } from '@/lib/go-back';
import { clearSavedCredentials, getSavedCredentials, setSavedCredentials } from '@/lib/saved-credentials';
import { showAlert } from '@/lib/show-alert';
import { supabase } from '@/lib/supabase/client';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';
import { radius, spacing, typography } from '@/theme/tokens';

// Same light, cream-and-forest-green look as the welcome screen (see
// onboarding-screen.tsx) — matches the brand mockup at
// design-assets/App Design/stitch_littlenuts_dryfruit_shopping_app/
// littlenuts_sign_in_screen/screen.png. A deliberate departure from the
// app's usual dark glass theme, same as onboarding.
const COLORS = {
  background: '#F8F3EA',
  card: '#FFFFFF',
  border: '#E8E1D2',
  badgeBg: '#EDE6D6',
  badgeText: '#2B2B22',
  heading: '#1C2A1E',
  subtitle: '#8B8A80',
  button: '#17241B',
  forgot: '#C1502E',
} as const;

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savePassword, setSavePassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    getSavedCredentials().then((saved) => {
      if (!saved) return;
      form.setValue('email', saved.email);
      form.setValue('password', saved.password);
      setSavePassword(true);
    });
    // Only pre-fill once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setIsSubmitting(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    await setHasAccount();
    if (savePassword) {
      await setSavedCredentials(values);
    } else {
      await clearSavedCredentials();
    }
    router.replace('/(customer)/(tabs)');
  }

  async function onForgotPassword() {
    const email = form.getValues('email').trim();
    if (!email) {
      setFormError('Enter your email above first, then tap "Forgot password?".');
      return;
    }
    setFormError(null);
    await supabase.auth.resetPasswordForEmail(email);
    // Deliberately the same message whether or not the email has an
    // account, so this can't be used to probe which emails are registered.
    showAlert('Check your email', 'If an account exists for that email, a reset link has been sent.');
  }

  function onGoogleContinue() {
    showAlert('Coming soon', 'Continue with Google will be available in a future update.');
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
            <Text style={styles.badgeText}>AUTH • SIGN IN</Text>
          </View>
        </View>

        <View style={styles.heading}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Access your account for seamless shopping for fresh, roasted and raw artisanal dry
            fruits.
          </Text>
        </View>

        {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}

        <View style={styles.form}>
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

          <View style={styles.optionsRow}>
            <Pressable onPress={() => setSavePassword((v) => !v)} hitSlop={8} style={styles.saveRow}>
              <View style={[styles.checkbox, savePassword && styles.checkboxChecked]}>
                {savePassword ? <Ionicons name="checkmark" size={14} color={COLORS.card} /> : null}
              </View>
              <Text style={styles.saveLabel}>Save password</Text>
            </Pressable>
            <Pressable onPress={onForgotPassword} hitSlop={8}>
              <Text style={styles.forgotLabel}>Forgot password?</Text>
            </Pressable>
          </View>

          <Pressable onPress={form.handleSubmit(onSubmit)} disabled={isSubmitting} style={styles.cta}>
            <Text style={styles.ctaLabel}>{isSubmitting ? 'Signing In…' : 'Sign In'}</Text>
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
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" asChild>
            <Text style={styles.footerLink}>Sign Up.</Text>
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type LightInputProps = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
};

function LightInput({ icon, error, secureTextEntry, style, ...inputProps }: LightInputProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.inputGroup}>
      <View style={[styles.inputWrap, error ? styles.inputWrapError : null]}>
        <Ionicons name={icon} size={18} color={COLORS.subtitle} style={styles.inputIcon} />
        <TextInput
          placeholderTextColor={COLORS.subtitle}
          secureTextEntry={isPassword && !visible}
          style={[styles.input, style]}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8} style={styles.inputRightIcon}>
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={COLORS.subtitle}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.inputError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
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
    backgroundColor: COLORS.badgeBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
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
  inputGroup: {
    gap: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: radius.pill,
    backgroundColor: COLORS.card,
  },
  inputWrapError: {
    borderColor: COLORS.forgot,
  },
  inputIcon: {
    marginLeft: spacing.md,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
    color: COLORS.heading,
  },
  inputRightIcon: {
    paddingHorizontal: spacing.md,
  },
  inputError: {
    ...typography.caption,
    color: COLORS.forgot,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.button,
    borderColor: COLORS.button,
  },
  saveLabel: {
    ...typography.caption,
    color: COLORS.heading,
  },
  forgotLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: COLORS.forgot,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.button,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  ctaLabel: {
    ...typography.bodyStrong,
    color: COLORS.card,
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
    textDecorationLine: 'underline',
  },
});
