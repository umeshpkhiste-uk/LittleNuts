import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { paiseToRupeesLabel } from '@littlenuts/shared';

import { PrimaryButton } from '@/components/primary-button';
import { useMyOrders } from '@/hooks/orders/use-orders';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/orders/labels';
import { useAuthStore } from '@/stores/auth-store';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function MyOrdersScreen() {
  const theme = useAppTheme();
  const session = useAuthStore((state) => state.session);
  const orders = useMyOrders();

  if (!session) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.badgeBg }]}>
          <Ionicons name="person-circle-outline" size={44} color={theme.accent} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>My Orders</Text>
        <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
          Log in to view your order history.
        </Text>
        <PrimaryButton title="Log In" onPress={() => router.push('/auth/login')} />
      </View>
    );
  }

  if (orders.isLoading) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!orders.data?.length) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <View style={[styles.emptyIconWrap, { backgroundColor: theme.badgeBg }]}>
          <Text style={styles.emptyIconEmoji}>🥜</Text>
          <View style={[styles.emptyIconBadge, { backgroundColor: theme.card, borderColor: theme.badgeBg }]}>
            <Ionicons name="receipt-outline" size={18} color={theme.accent} />
          </View>
        </View>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No orders yet</Text>
        <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>
          Your harvest basket is empty for now. Place your first order and{'\n'}it will show up right here.
        </Text>
        <PrimaryButton title="Browse Products" onPress={() => router.push('/(customer)/(tabs)')} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>My Orders</Text>
      {orders.data.map((order) => (
        <Pressable
          key={order.id}
          onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.orderNumber, { color: theme.textPrimary }]}>
              {order.order_number}
            </Text>
            <Text style={[styles.total, { color: theme.primary }]}>
              {paiseToRupeesLabel(order.total_paise)}
            </Text>
          </View>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {new Date(order.created_at).toLocaleDateString('en-IN')} · {ORDER_STATUS_LABELS[order.status]} ·{' '}
            {PAYMENT_STATUS_LABELS[order.payment_status]}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyIconWrap: {
    width: 104,
    height: 104,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emptyIconEmoji: {
    fontSize: 44,
  },
  emptyIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.h1,
  },
  emptyBody: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 21,
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    ...typography.h1,
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
  total: {
    ...typography.bodyStrong,
  },
  meta: {
    ...typography.caption,
  },
});
