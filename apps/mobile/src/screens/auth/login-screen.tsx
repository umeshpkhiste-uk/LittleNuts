import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormTextInput } from '@/components/form-text-input';
import { PrimaryButton } from '@/components/primary-button';
import { setHasAccount } from '@/lib/account-history';
import { clearSavedCredentials, getSavedCredentials, setSavedCredentials } from '@/lib/saved-credentials';
import { showAlert } from '@/lib/show-alert';
import { supabase } from '@/lib/supabase/client';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function LoginScreen() {
  const theme = useAppTheme();
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
          { backgroundColor: theme.background, paddingTop: insets.top + spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={[styles.backButton, { borderColor: theme.border, backgroundColor: theme.card }]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
        </Pressable>

        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Welcome back</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Access your account for seamless shopping for fresh and delicious groceries
          </Text>
        </View>

        {formError ? (
          <Text style={[styles.errorBanner, { color: theme.danger }]}>{formError}</Text>
        ) : null}

        <View style={styles.form}>
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <FormTextInput
                placeholder="Email Address"
                icon="mail-outline"
                shape="pill"
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
              <FormTextInput
                placeholder="Password"
                icon="lock-closed-outline"
                shape="pill"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />

          <View style={styles.optionsRow}>
            <Pressable
              onPress={() => setSavePassword((v) => !v)}
              hitSlop={8}
              style={styles.saveRow}
            >
              <Ionicons
                name={savePassword ? 'checkbox' : 'square-outline'}
                size={18}
                color={savePassword ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.saveLabel, { color: theme.textSecondary }]}>Save password</Text>
            </Pressable>
            <Pressable onPress={onForgotPassword} hitSlop={8}>
              <Text style={[styles.forgotLabel, { color: theme.danger }]}>Forgot password?</Text>
            </Pressable>
          </View>

          <PrimaryButton
            title="Sign In"
            loading={isSubmitting}
            onPress={form.handleSubmit(onSubmit)}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textSecondary }]}>Or continue with</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        </View>

        <Pressable
          onPress={onGoogleContinue}
          style={[styles.socialButton, { borderColor: theme.border, backgroundColor: theme.card }]}
        >
          <Ionicons name="logo-google" size={18} color={theme.textPrimary} />
          <Text style={[styles.socialLabel, { color: theme.textPrimary }]}>
            Continue with Google
          </Text>
        </Pressable>

        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" asChild>
            <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign Up</Text>
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    gap: spacing.sm,
  },
  title: {
    ...typography.display,
  },
  subtitle: {
    ...typography.body,
  },
  form: {
    gap: spacing.md,
  },
  errorBanner: {
    ...typography.body,
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
  saveLabel: {
    ...typography.caption,
  },
  forgotLabel: {
    ...typography.caption,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    ...typography.caption,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  socialLabel: {
    ...typography.bodyStrong,
  },
  footer: {
    ...typography.body,
    textAlign: 'center',
  },
});
