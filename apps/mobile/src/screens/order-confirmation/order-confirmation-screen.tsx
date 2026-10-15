import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { paiseToRupeesLabel } from '@littlenuts/shared';

import { PrimaryButton } from '@/components/primary-button';
import { useOrder } from '@/hooks/orders/use-orders';
import { PAYMENT_STATUS_LABELS } from '@/lib/orders/labels';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

export function OrderConfirmationScreen({ orderId }: { orderId: string }) {
  const theme = useAppTheme();
  const { data, isLoading } = useOrder(orderId);

  if (isLoading || !data) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const { order } = data;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Ionicons name="checkmark-circle" size={72} color={theme.accent} />
      <Text style={[styles.title, { color: theme.textPrimary }]}>Order Placed!</Text>
      <Text style={[styles.body, { color: theme.textSecondary }]}>
        Thank you for your order. We&apos;ll deliver it to you soon.
      </Text>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Row label="Order ID" value={order.order_number} theme={theme} />
        <Row label="Total" value={paiseToRupeesLabel(order.total_paise)} theme={theme} />
        <Row
          label="Payment"
          value={
            order.payment_method === 'cod'
              ? 'Cash on Delivery'
              : PAYMENT_STATUS_LABELS[order.payment_status]
          }
          theme={theme}
        />
      </View>

      <PrimaryButton
        title="Track Order"
        onPress={() => router.replace({ pathname: '/order/[id]', params: { id: order.id } })}
      />
      <PrimaryButton
        title="Continue Shopping"
        variant="secondary"
        onPress={() => router.replace('/(customer)/(tabs)')}
      />
    </View>
  );
}

function Row({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: theme.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...typography.caption,
  },
  rowValue: {
    ...typography.bodyStrong,
  },
});
