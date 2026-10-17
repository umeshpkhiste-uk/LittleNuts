import { useState } from 'react';
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
import { goBack } from '@/lib/go-back';
import { showAlert } from '@/lib/show-alert';
import { supabase } from '@/lib/supabase/client';
import { registerSchema, type RegisterInput } from '@/lib/validation/auth';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function RegisterScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    });
    setIsSubmitting(false);
    if (error) {
      setFormError(error.message);
      return;
    }

    // The account now exists either way, even if confirmation is still
    // pending below — later logged-out visits should offer sign-in, not
    // sign-up, so mark it here rather than only on the confirmed-session path.
    await setHasAccount();

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
      <View style={[styles.confirmContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Check your email</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          We&apos;ve sent a confirmation link to your email address. Verify it, then sign in.
        </Text>
        <Link href="/auth/login" asChild>
          <Text style={StyleSheet.flatten([styles.link, { color: theme.primary }])}>
            Back to Sign In
          </Text>
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
          { backgroundColor: theme.background, paddingTop: insets.top + spacing.md },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => goBack()}
          hitSlop={8}
          style={[styles.backButton, { borderColor: theme.border, backgroundColor: theme.card }]}
        >
          <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
        </Pressable>

        <View style={styles.heading}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Register Now</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Begin your grocery journey and get access to amazing offers and fresh and delicious
            groceries
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
          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <FormTextInput
                placeholder="Confirm Password"
                icon="lock-closed-outline"
                shape="pill"
                secureTextEntry
                value={field.value}
                onChangeText={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <PrimaryButton
            title="Create Account"
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
          Already have an account?{' '}
          <Link href="/auth/login" asChild>
            <Text style={{ color: theme.primary, fontWeight: '700' }}>Sign In</Text>
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
  confirmContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
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
  body: {
    ...typography.body,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  errorBanner: {
    ...typography.body,
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
  link: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
