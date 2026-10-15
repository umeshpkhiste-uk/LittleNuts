import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { FormTextInput } from '@/components/form-text-input';
import { PrimaryButton } from '@/components/primary-button';
import { supabase } from '@/lib/supabase/client';
import { registerSchema, type RegisterInput } from '@/lib/validation/auth';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

export function RegisterScreen() {
  const theme = useAppTheme();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
      },
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

  if (confirmationSent) {
    return (
      <View style={[styles.confirmContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Check your email</Text>
        <Text style={[styles.body, { color: theme.textSecondary }]}>
          We&apos;ve sent a confirmation link to your email address. Verify it, then log in.
        </Text>
        <Link href="/auth/login" asChild>
          <Text style={[styles.link, { color: theme.primary }]}>Back to Log In</Text>
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
        contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.textPrimary }]}>Create your account</Text>

        {formError ? (
          <Text style={[styles.errorBanner, { color: theme.danger }]}>{formError}</Text>
        ) : null}

        <View style={styles.form}>
          <Controller
            control={form.control}
            name="fullName"
            render={({ field, fieldState }) => (
              <FormTextInput
                label="Full name"
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
              <FormTextInput
                label="Email"
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
                label="Password"
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

        <Link href="/auth/login" asChild>
          <Text style={[styles.link, { color: theme.primary }]}>
            Already have an account? Log in
          </Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  confirmContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.display,
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
  link: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
