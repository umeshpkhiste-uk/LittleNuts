import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { paiseToRupeesLabel } from '@littlenuts/shared';

import { PrimaryButton } from '@/components/primary-button';
import { useMyOrders } from '@/hooks/orders/use-orders';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/orders/labels';
import { useAuthStore } from '@/stores/auth-store';
import type { AppTheme } from '@/theme/colors';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function formatDateKeyLabel(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function MyOrdersScreen() {
  const theme = useAppTheme();
  const session = useAuthStore((state) => state.session);
  const orders = useMyOrders();
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const filteredOrders = useMemo(() => {
    if (!selectedDateKey) return orders.data ?? [];
    return (orders.data ?? []).filter((order) => toDateKey(new Date(order.created_at)) === selectedDateKey);
  }, [orders.data, selectedDateKey]);
  const orderDateKeys = useMemo(
    () => new Set((orders.data ?? []).map((order) => toDateKey(new Date(order.created_at)))),
    [orders.data],
  );

  if (!session) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.background }]}>
        <Image source={require('../../../assets/icon.png')} style={styles.emptyLogo} resizeMode="cover" />
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
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>My Orders</Text>
        <Pressable
          onPress={() => setPickerVisible(true)}
          style={[
            styles.dateFilterPill,
            { borderColor: selectedDateKey ? theme.primary : theme.border, backgroundColor: theme.card },
          ]}
        >
          <Ionicons name="calendar-outline" size={14} color={selectedDateKey ? theme.primary : theme.textSecondary} />
          <Text
            style={[
              styles.dateFilterText,
              { color: selectedDateKey ? theme.primary : theme.textSecondary },
            ]}
          >
            {selectedDateKey ? formatDateKeyLabel(selectedDateKey) : 'Filter by date'}
          </Text>
          {selectedDateKey ? (
            <Pressable onPress={() => setSelectedDateKey(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.primary} />
            </Pressable>
          ) : null}
        </Pressable>
      </View>

      {filteredOrders.length ? (
        filteredOrders.map((order) => (
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
        ))
      ) : (
        <View style={styles.noMatch}>
          <Ionicons name="calendar-clear-outline" size={28} color={theme.textSecondary} />
          <Text style={[styles.noMatchText, { color: theme.textSecondary }]}>
            No orders placed on {selectedDateKey ? formatDateKeyLabel(selectedDateKey) : ''}.
          </Text>
          <Pressable onPress={() => setSelectedDateKey(null)} hitSlop={8}>
            <Text style={[styles.noMatchClear, { color: theme.primary }]}>Clear filter</Text>
          </Pressable>
        </View>
      )}

      <DateFilterModal
        visible={pickerVisible}
        theme={theme}
        selectedDateKey={selectedDateKey}
        orderDateKeys={orderDateKeys}
        onSelect={(key) => {
          setSelectedDateKey(key);
          if (key) setPickerVisible(false);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </ScrollView>
  );
}

function DateFilterModal({
  visible,
  theme,
  selectedDateKey,
  orderDateKeys,
  onSelect,
  onClose,
}: {
  visible: boolean;
  theme: AppTheme;
  selectedDateKey: string | null;
  orderDateKeys: Set<string>;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => {
    if (selectedDateKey) {
      const [year, month] = selectedDateKey.split('-').map(Number);
      return new Date(year, month - 1, 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const todayKey = toDateKey(today);
  const monthLabel = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const leadingBlanks = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(viewDate.getFullYear(), viewDate.getMonth(), i + 1)),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.calendarCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.calendarHeader}>
            <Pressable
              onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              hitSlop={8}
            >
              <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
            </Pressable>
            <Text style={[styles.calendarMonth, { color: theme.textPrimary }]}>{monthLabel}</Text>
            <Pressable
              onPress={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              hitSlop={8}
            >
              <Ionicons name="chevron-forward" size={20} color={theme.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.calendarWeekRow}>
            {WEEKDAY_LABELS.map((label, index) => (
              <Text key={index} style={[styles.calendarWeekLabel, { color: theme.textSecondary }]}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {cells.map((date, index) => {
              if (!date) return <View key={index} style={styles.calendarCell} />;
              const key = toDateKey(date);
              const isFuture = key > todayKey;
              const isSelected = key === selectedDateKey;
              const hasOrders = orderDateKeys.has(key);
              return (
                <Pressable
                  key={index}
                  disabled={isFuture}
                  onPress={() => onSelect(key)}
                  style={styles.calendarCell}
                >
                  <View
                    style={[
                      styles.calendarDay,
                      isSelected ? { backgroundColor: theme.primary } : null,
                      key === todayKey && !isSelected ? { borderWidth: 1, borderColor: theme.primary } : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.calendarDayText,
                        { color: isSelected ? theme.primaryText : isFuture ? theme.textMuted : theme.textPrimary },
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                    {hasOrders && !isSelected ? (
                      <View style={[styles.calendarDot, { backgroundColor: theme.accent }]} />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {selectedDateKey ? (
            <Pressable
              onPress={() => onSelect('')}
              style={[styles.calendarClearButton, { borderColor: theme.border }]}
            >
              <Text style={[styles.calendarClearText, { color: theme.textSecondary }]}>Clear filter</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
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
  emptyLogo: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dateFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  dateFilterText: {
    ...typography.caption,
    fontWeight: '700',
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
  noMatch: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  noMatchText: {
    ...typography.body,
    textAlign: 'center',
  },
  noMatchClear: {
    ...typography.bodyStrong,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  calendarCard: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarMonth: {
    ...typography.bodyStrong,
  },
  calendarWeekRow: {
    flexDirection: 'row',
  },
  calendarWeekLabel: {
    ...typography.caption,
    fontWeight: '700',
    width: `${100 / 7}%`,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    ...typography.caption,
    fontWeight: '600',
  },
  calendarDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: radius.pill,
  },
  calendarClearButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  calendarClearText: {
    ...typography.bodyStrong,
  },
});
