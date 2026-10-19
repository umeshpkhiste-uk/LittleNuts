import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppTheme } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

type LightInputProps = TextInputProps & {
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
};

// Plain white pill input used by the light-themed screens (Sign In,
// Register, etc.). Not the dark-glass FormTextInput used elsewhere —
// styled from the active theme (see src/theme/colors.ts) so it still
// looks right if the user switches to dark mode.
export function LightInput({ icon, error, secureTextEntry, style, ...inputProps }: LightInputProps) {
  const COLORS = useAppTheme();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
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

const createStyles = (COLORS: AppTheme) =>
  StyleSheet.create({
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
  });
