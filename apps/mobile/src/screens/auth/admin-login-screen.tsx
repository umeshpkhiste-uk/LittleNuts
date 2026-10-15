import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { FormTextInput } from '@/components/form-text-input';
import { PrimaryButton } from '@/components/primary-button';
import { supabase } from '@/lib/supabase/client';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

// Authenticates like any other user, then immediately re-checks the role
// from the trusted user_roles table before ever navigating to /admin. If
// the signed-in account isn't an admin, the session is signed back out
// right here — this screen never trusts "login succeeded" as "is admin".
// The real enforcement is still RLS + private.is_admin() on the backend;
// this check only keeps a non-admin from briefly seeing the admin UI.
export function AdminLoginScreen() {
  const theme = useAppTheme();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    setIsSubmitting(true);

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword(values);

    if (signInError) {
      setIsSubmitting(false);
      setFormError(signInError.message);
      return;
    }

    const { data: roleRow, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', signInData.user.id)
      .maybeSingle();

    setIsSubmitting(false);

    if (roleError || roleRow?.role !== 'admin') {
      await supabase.auth.signOut();
      setFormError('This account is not authorized for store admin access.');
      return;
    }

    router.replace('/admin');
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Store Admin</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Authorized administrators only.
        </Text>

        {formError ? (
          <Text style={[styles.errorBanner, { color: theme.danger }]}>{formError}</Text>
        ) : null}

        <View style={styles.form}>
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
            title="Log In"
            loading={isSubmitting}
            onPress={form.handleSubmit(onSubmit)}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    justifyContent: 'center',
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
});
