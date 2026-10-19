import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

type FormTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  shape?: 'default' | 'pill';
};

export function FormTextInput({
  label,
  error,
  icon,
  shape = 'default',
  secureTextEntry,
  style,
  ...inputProps
}: FormTextInputProps) {
  const theme = useAppTheme();
  const [visible, setVisible] = useState(false);
  const isPassword = !!secureTextEntry;

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text> : null}
      <View
        style={[
          styles.inputWrap,
          { borderColor: error ? theme.danger : theme.border },
          shape === 'pill' && styles.inputWrapPill,
        ]}
      >
        <BlurView
          intensity={30}
          tint={theme.mode === 'light' ? 'light' : 'dark'}
          style={StyleSheet.absoluteFill}
        />
        {icon ? <Ionicons name={icon} size={18} color={theme.textMuted} style={styles.leftIcon} /> : null}
        <TextInput
          placeholderTextColor={theme.textMuted}
          secureTextEntry={isPassword && !visible}
          style={[styles.input, icon ? styles.inputWithIcon : null, { color: theme.textPrimary }, style]}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8} style={styles.rightIcon}>
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={theme.textMuted}
            />
          </Pressable>
        ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  inputWrapPill: {
    borderRadius: radius.pill,
  },
  leftIcon: {
    marginLeft: spacing.md,
  },
  rightIcon: {
    paddingHorizontal: spacing.md,
  },
  input: {
    position: 'relative',
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
  },
  inputWithIcon: {
    paddingLeft: spacing.sm,
  },
  error: {
    ...typography.caption,
  },
});
