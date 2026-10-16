import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { BlurView } from 'expo-blur';

import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

type FormTextInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormTextInput({ label, error, style, ...inputProps }: FormTextInputProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrap, { borderColor: error ? theme.danger : theme.border }]}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        <TextInput
          placeholderTextColor={theme.textMuted}
          style={[styles.input, { color: theme.textPrimary }, style]}
          {...inputProps}
        />
      </View>
      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
  },
  inputWrap: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
  },
  error: {
    ...typography.caption,
  },
});
