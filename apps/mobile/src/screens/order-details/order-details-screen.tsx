import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatWeight, paiseToRupeesLabel } from '@littlenuts/shared';

import { useOrder } from '@/hooks/orders/use-orders';
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE, PAYMENT_STATUS_LABELS } from '@/lib/orders/labels';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function OrderDetailsScreen({ orderId }: { orderId: string }) {
  const theme = useAppTheme();
  const { data, isLoading } = useOrder(orderId);

  if (isLoading || !data) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const { order, items } = data;
  const isTerminalNegative = order.status === 'rejected' || order.status === 'cancelled';
  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(order.status);
  const address = order.address_snapshot;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={[styles.orderNumber, { color: theme.textPrimary }]}>{order.order_number}</Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {new Date(order.created_at).toLocaleString('en-IN')}
        </Text>
      </View>

      {isTerminalNegative ? (
        <View style={[styles.statusBanner, { backgroundColor: theme.danger }]}>
          <Text style={styles.statusBannerText}>
            {ORDER_STATUS_LABELS[order.status]}
            {order.rejection_reason ? ` — ${order.rejection_reason}` : ''}
          </Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {ORDER_STATUS_SEQUENCE.map((status, index) => {
            const done = index <= currentIndex;
            return (
              <View key={status} style={styles.timelineStep}>
                <Ionicons
                  name={done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={done ? theme.accent : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.timelineLabel,
                    { color: done ? theme.textPrimary : theme.textSecondary },
                  ]}
                >
                  {ORDER_STATUS_LABELS[status]}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <Section title="Items">
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.product_name_snapshot} ({formatWeight(item.quantity_g)})
            </Text>
            <Text style={[styles.itemPrice, { color: theme.textSecondary }]}>
              {paiseToRupeesLabel(item.subtotal_paise)}
            </Text>
          </View>
        ))}
      </Section>

      <Section title="Payment">
        <Row label="Method" value={order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online'} theme={theme} />
        <Row label="Status" value={PAYMENT_STATUS_LABELS[order.payment_status]} theme={theme} />
        <Row label="Subtotal" value={paiseToRupeesLabel(order.subtotal_paise)} theme={theme} />
        <Row
          label="Delivery Fee"
          value={order.delivery_fee_paise === 0 ? 'Free' : paiseToRupeesLabel(order.delivery_fee_paise)}
          theme={theme}
        />
        {order.tax_paise > 0 ? (
          <Row label="Tax" value={paiseToRupeesLabel(order.tax_paise)} theme={theme} />
        ) : null}
        <Row label="Total" value={paiseToRupeesLabel(order.total_paise)} theme={theme} emphasis />
      </Section>

      <Section title="Delivery Address">
        <Text style={[styles.addressText, { color: theme.textSecondary }]}>
          {address.recipient_name} — {address.phone_number}
        </Text>
        <Text style={[styles.addressText, { color: theme.textSecondary }]}>
          {address.address_line_1}
          {address.address_line_2 ? `, ${address.address_line_2}` : ''}
        </Text>
        <Text style={[styles.addressText, { color: theme.textSecondary }]}>
          {address.city}, {address.state} {address.postal_code}
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useAppTheme();
  return (
    <View style={[styles.section, { borderColor: theme.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({
  label,
  value,
  theme,
  emphasis,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>;
  emphasis?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[emphasis ? styles.rowLabelStrong : styles.rowLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[emphasis ? styles.rowValueStrong : styles.rowValue, { color: theme.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.xs,
  },
  orderNumber: {
    ...typography.h1,
  },
  meta: {
    ...typography.caption,
  },
  statusBanner: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statusBannerText: {
    color: '#fff',
    ...typography.bodyStrong,
  },
  timeline: {
    gap: spacing.sm,
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timelineLabel: {
    ...typography.body,
  },
  section: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  itemName: {
    ...typography.caption,
    flex: 1,
  },
  itemPrice: {
    ...typography.caption,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowLabel: {
    ...typography.caption,
  },
  rowValue: {
    ...typography.caption,
  },
  rowLabelStrong: {
    ...typography.bodyStrong,
  },
  rowValueStrong: {
    ...typography.bodyStrong,
  },
  addressText: {
    ...typography.caption,
  },
});
