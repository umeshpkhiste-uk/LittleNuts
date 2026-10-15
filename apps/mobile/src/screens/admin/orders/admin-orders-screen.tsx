import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { paiseToRupeesLabel } from '@littlenuts/shared';

import { useAdminOrders, type AdminOrderTab } from '@/hooks/admin/use-admin-orders';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/orders/labels';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

const TABS: { key: AdminOrderTab; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'paid_awaiting_acceptance', label: 'Paid, Awaiting Acceptance' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready_for_dispatch', label: 'Ready for Dispatch' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'rejected_cancelled', label: 'Rejected / Cancelled' },
  { key: 'all', label: 'All Orders' },
];

export function AdminOrdersScreen() {
  const theme = useAppTheme();
  const [tab, setTab] = useState<AdminOrderTab>('new');
  const orders = useAdminOrders(tab);

  useRealtimeInvalidate('orders', [['admin-orders']]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map((t) => (
          <Text
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[
              styles.tab,
              {
                backgroundColor: tab === t.key ? theme.primary : theme.surface,
                color: tab === t.key ? theme.primaryText : theme.textPrimary,
                borderColor: theme.border,
              },
            ]}
          >
            {t.label}
          </Text>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {orders.isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : orders.data?.length ? (
          orders.data.map((order) => (
            <Pressable
              key={order.id}
              onPress={() => router.push(`/admin/order/${order.id}`)}
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.orderNumber, { color: theme.textPrimary }]}>
                  {order.order_number}
                </Text>
                <Text style={[styles.amount, { color: theme.primary }]}>
                  {paiseToRupeesLabel(order.total_paise)}
                </Text>
              </View>
              <Text style={[styles.customer, { color: theme.textPrimary }]}>
                {order.customer_name ?? 'Customer'}
              </Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {new Date(order.created_at).toLocaleString('en-IN')}
              </Text>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {ORDER_STATUS_LABELS[order.status]} · {order.payment_method === 'cod' ? 'COD' : 'Online'} ·{' '}
                {PAYMENT_STATUS_LABELS[order.payment_status]}
              </Text>
            </Pressable>
          ))
        ) : (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No orders in this view.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  tab: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.caption,
    fontWeight: '700',
    overflow: 'hidden',
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderNumber: {
    ...typography.bodyStrong,
  },
  amount: {
    ...typography.bodyStrong,
  },
  customer: {
    ...typography.body,
  },
  meta: {
    ...typography.caption,
  },
  empty: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
