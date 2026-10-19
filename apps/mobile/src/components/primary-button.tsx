import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

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
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      style={(state) => [
        styles.wrap,
        !isPrimary && styles.secondaryWrap,
        !isPrimary && { borderColor: theme.border },
        { opacity: state.pressed ? 0.85 : isDisabled ? 0.5 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...pressableProps}
    >
      {isPrimary ? (
        <View style={[styles.fill, { backgroundColor: theme.primary }]}>
          <ButtonContent loading={loading} title={title} color={theme.primaryText} />
        </View>
      ) : (
        <View style={styles.fill}>
          <ButtonContent loading={loading} title={title} color={theme.textPrimary} />
        </View>
      )}
    </Pressable>
  );
}

function ButtonContent({ loading, title, color }: { loading?: boolean; title: string; color: string }) {
  return loading ? (
    <ActivityIndicator color={color} />
  ) : (
    <Text style={[styles.label, { color }]}>{title}</Text>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  secondaryWrap: {
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  fill: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.bodyStrong,
  },
});
