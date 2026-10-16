import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { FormTextInput } from '@/components/form-text-input';
import { PrimaryButton } from '@/components/primary-button';
import { supabase } from '@/lib/supabase/client';
import {
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  type LoginInput,
  type OtpRequestInput,
  type OtpVerifyInput,
} from '@/lib/validation/auth';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

type Mode = 'email' | 'mobile';

export function LoginScreen() {
  const theme = useAppTheme();
  const [mode, setMode] = useState<Mode>('email');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);

  const emailForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const otpRequestForm = useForm<OtpRequestInput>({
    resolver: zodResolver(otpRequestSchema),
    defaultValues: { phone: '' },
  });

  const otpVerifyForm = useForm<OtpVerifyInput>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { phone: '', token: '' },
  });

  async function onEmailSubmit(values: LoginInput) {
    setFormError(null);
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setIsSubmitting(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    router.replace('/(customer)/(tabs)');
  }

  async function onRequestOtp(values: OtpRequestInput) {
    setFormError(null);
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: values.phone });
    setIsSubmitting(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    otpVerifyForm.setValue('phone', values.phone);
    setOtpSentTo(values.phone);
  }

  async function onVerifyOtp(values: OtpVerifyInput) {
    setFormError(null);
    setIsSubmitting(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: values.phone,
      token: values.token,
      type: 'sms',
    });
    setIsSubmitting(false);
    if (error) {
      setFormError(error.message);
      return;
    }
    router.replace('/(customer)/(tabs)');
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
        <Text style={[styles.title, { color: theme.textPrimary }]}>Welcome back</Text>

        <View style={[styles.tabs, { borderColor: theme.border }]}>
          <TabButton label="Email" active={mode === 'email'} onPress={() => setMode('email')} />
          <TabButton
            label="Mobile OTP"
            active={mode === 'mobile'}
            onPress={() => setMode('mobile')}
          />
        </View>

        {formError ? (
          <Text style={[styles.errorBanner, { color: theme.danger }]}>{formError}</Text>
        ) : null}

        {mode === 'email' ? (
          <View style={styles.form}>
            <Controller
              control={emailForm.control}
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
              control={emailForm.control}
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
              onPress={emailForm.handleSubmit(onEmailSubmit)}
            />
          </View>
        ) : (
          <View style={styles.form}>
            <Controller
              control={otpRequestForm.control}
              name="phone"
              render={({ field, fieldState }) => (
                <FormTextInput
                  label="Mobile number"
                  placeholder="+919876543210"
                  autoCapitalize="none"
                  keyboardType="phone-pad"
                  editable={!otpSentTo}
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
            {!otpSentTo ? (
              <PrimaryButton
                title="Send OTP"
                loading={isSubmitting}
                onPress={otpRequestForm.handleSubmit(onRequestOtp)}
              />
            ) : (
              <>
                <Controller
                  control={otpVerifyForm.control}
                  name="token"
                  render={({ field, fieldState }) => (
                    <FormTextInput
                      label="6-digit code"
                      keyboardType="number-pad"
                      value={field.value}
                      onChangeText={field.onChange}
                      error={fieldState.error?.message}
                    />
                  )}
                />
                <PrimaryButton
                  title="Verify & Log In"
                  loading={isSubmitting}
                  onPress={otpVerifyForm.handleSubmit(onVerifyOtp)}
                />
                <PrimaryButton
                  title="Use a different number"
                  variant="secondary"
                  onPress={() => {
                    setOtpSentTo(null);
                    setFormError(null);
                  }}
                />
              </>
            )}
            <Text style={[styles.hint, { color: theme.textSecondary }]}>
              Mobile OTP requires an SMS provider to be configured on the Supabase project. If
              this fails, email login still works.
            </Text>
          </View>
        )}

        <Link href="/auth/register" asChild>
          <Text style={StyleSheet.flatten([styles.link, { color: theme.primary }])}>
            Don&apos;t have an account? Create one
          </Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  return (
    <Text
      onPress={onPress}
      style={[
        styles.tab,
        {
          color: active ? theme.primaryText : theme.textSecondary,
          backgroundColor: active ? theme.primary : 'transparent',
        },
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    ...typography.display,
  },
  tabs: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    overflow: 'hidden',
    ...typography.bodyStrong,
  },
  form: {
    gap: spacing.md,
  },
  errorBanner: {
    ...typography.body,
  },
  hint: {
    ...typography.caption,
  },
  link: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
