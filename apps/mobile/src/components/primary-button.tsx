import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

type PrimaryButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
};

export function PrimaryButton({
  title,
  loading,
  variant = 'primary',
  disabled,
  style,
  ...pressableProps
}: PrimaryButtonProps) {
  const theme = useAppTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      disabled={disabled || loading}
      style={(state) => [
        styles.button,
        {
          backgroundColor: isPrimary ? theme.primary : 'transparent',
          borderWidth: isPrimary ? 0 : 1,
          borderColor: theme.border,
          opacity: state.pressed || disabled || loading ? 0.7 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? theme.primaryText : theme.textPrimary} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: isPrimary ? theme.primaryText : theme.textPrimary },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodyStrong,
  },
});
