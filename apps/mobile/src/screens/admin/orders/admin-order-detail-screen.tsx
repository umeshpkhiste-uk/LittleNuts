import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { formatWeight, paiseToRupeesLabel, type OrderStatus } from '@littlenuts/shared';

import { FormTextInput } from '@/components/form-text-input';
import { PrimaryButton } from '@/components/primary-button';
import {
  useAcceptOrder,
  useAdminCancelOrder,
  useAdminOrder,
  useRejectOrder,
  useUpdateOrderStatus,
} from '@/hooks/admin/use-admin-orders';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/orders/labels';
import { useAppTheme } from '@/theme/theme-provider';
import { spacing, typography } from '@/theme/tokens';

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  accepted: 'preparing',
  preparing: 'ready_for_dispatch',
  ready_for_dispatch: 'out_for_delivery',
  out_for_delivery: 'delivered',
};

const CANCELLABLE_STATUSES: OrderStatus[] = ['accepted', 'preparing', 'ready_for_dispatch'];

export function AdminOrderDetailScreen({ orderId }: { orderId: string }) {
  const theme = useAppTheme();
  const { data, isLoading } = useAdminOrder(orderId);
  const acceptOrder = useAcceptOrder();
  const rejectOrder = useRejectOrder();
  const updateStatus = useUpdateOrderStatus();
  const cancelOrder = useAdminCancelOrder();

  useRealtimeInvalidate('orders', [['admin-order', orderId], ['admin-orders']]);

  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCancelInput, setShowCancelInput] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !data) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const { order, items, customerName, customerPhone } = data;
  const address = order.address_snapshot;
  const nextStatus = NEXT_STATUS[order.status];
  const totalWeightG = items.reduce((sum, item) => sum + item.quantity_g, 0);

  async function handleAccept() {
    setError(null);
    try {
      await acceptOrder.mutateAsync(orderId);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Could not accept order.');
    }
  }

  async function handleReject() {
    setError(null);
    if (!rejectionReason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    try {
      await rejectOrder.mutateAsync({ orderId, reason: rejectionReason.trim() });
      router.back();
    } catch (rejectError) {
      setError(rejectError instanceof Error ? rejectError.message : 'Could not reject order.');
    }
  }

  async function handleAdvanceStatus() {
    if (!nextStatus) return;
    setError(null);
    try {
      await updateStatus.mutateAsync({ orderId, newStatus: nextStatus });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update status.');
    }
  }

  async function handleCancel() {
    setError(null);
    if (!cancelReason.trim()) {
      setError('A cancellation reason is required.');
      return;
    }
    try {
      await cancelOrder.mutateAsync({ orderId, reason: cancelReason.trim() });
      router.back();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel order.');
    }
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <View style={styles.header}>
        <Text style={[styles.orderNumber, { color: theme.textPrimary }]}>{order.order_number}</Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]}>
          {new Date(order.created_at).toLocaleString('en-IN')} · {ORDER_STATUS_LABELS[order.status]}
        </Text>
      </View>

      <Section title="Customer">
        <Text style={[styles.text, { color: theme.textPrimary }]}>{customerName ?? 'Customer'}</Text>
        {customerPhone ? (
          <Text style={[styles.text, { color: theme.textSecondary }]}>{customerPhone}</Text>
        ) : null}
      </Section>

      <Section title="Delivery Address">
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          {address.recipient_name} — {address.phone_number}
        </Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          {address.address_line_1}
          {address.address_line_2 ? `, ${address.address_line_2}` : ''}
        </Text>
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          {address.city}, {address.state} {address.postal_code}
        </Text>
        {address.delivery_instructions ? (
          <Text style={[styles.text, { color: theme.textSecondary }]}>
            Note: {address.delivery_instructions}
          </Text>
        ) : null}
      </Section>

      <Section title={`Items — ${formatWeight(totalWeightG)} total`}>
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
        <Text style={[styles.text, { color: theme.textSecondary }]}>
          {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online (Razorpay)'} ·{' '}
          {PAYMENT_STATUS_LABELS[order.payment_status]}
        </Text>
        <Text style={[styles.totalText, { color: theme.textPrimary }]}>
          Total: {paiseToRupeesLabel(order.total_paise)}
        </Text>
        {order.payment_method === 'razorpay' && order.payment_status !== 'paid' ? (
          <Text style={[styles.warning, { color: theme.danger }]}>
            Online payment not yet confirmed — consider waiting for payment before accepting.
          </Text>
        ) : null}
      </Section>

      {error ? <Text style={[styles.warning, { color: theme.danger }]}>{error}</Text> : null}

      {order.status === 'pending' ? (
        <View style={styles.actions}>
          <PrimaryButton title="Accept Order" loading={acceptOrder.isPending} onPress={handleAccept} />
          {showRejectInput ? (
            <>
              <FormTextInput
                label="Rejection reason"
                value={rejectionReason}
                onChangeText={setRejectionReason}
              />
              <PrimaryButton
                title="Confirm Rejection"
                variant="secondary"
                loading={rejectOrder.isPending}
                onPress={handleReject}
              />
            </>
          ) : (
            <PrimaryButton
              title="Reject Order"
              variant="secondary"
              onPress={() => setShowRejectInput(true)}
            />
          )}
        </View>
      ) : (
        <View style={styles.actions}>
          {nextStatus ? (
            <PrimaryButton
              title={`Mark as ${ORDER_STATUS_LABELS[nextStatus]}`}
              loading={updateStatus.isPending}
              onPress={handleAdvanceStatus}
            />
          ) : null}

          {CANCELLABLE_STATUSES.includes(order.status) ? (
            showCancelInput ? (
              <>
                <FormTextInput
                  label="Cancellation reason"
                  value={cancelReason}
                  onChangeText={setCancelReason}
                />
                <PrimaryButton
                  title="Confirm Cancellation (restocks items)"
                  variant="secondary"
                  loading={cancelOrder.isPending}
                  onPress={handleCancel}
                />
              </>
            ) : (
              <PrimaryButton
                title="Cancel Order"
                variant="secondary"
                onPress={() => setShowCancelInput(true)}
              />
            )
          ) : null}
        </View>
      )}
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
  section: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  text: {
    ...typography.caption,
  },
  totalText: {
    ...typography.bodyStrong,
    marginTop: spacing.xs,
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
  warning: {
    ...typography.caption,
    fontWeight: '600',
  },
  actions: {
    gap: spacing.sm,
    borderTopWidth: 1,
    borderColor: 'transparent',
    paddingTop: spacing.md,
  },
});
