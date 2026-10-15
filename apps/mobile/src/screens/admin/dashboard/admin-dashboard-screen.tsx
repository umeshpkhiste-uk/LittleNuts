import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { paiseToRupeesLabel } from '@littlenuts/shared';

import { useAdminDashboardSummary } from '@/hooks/admin/use-admin-dashboard';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

export function AdminDashboardScreen() {
  const theme = useAppTheme();
  const { data, isLoading } = useAdminDashboardSummary();

  useRealtimeInvalidate('orders', [['admin-dashboard-summary']]);
  useRealtimeInvalidate('products', [['admin-dashboard-summary']]);

  if (isLoading || !data) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  const awaitingAttention = data.pending_count + data.paid_awaiting_acceptance_count;

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>Dashboard</Text>

      {awaitingAttention > 0 ? (
        <Text
          onPress={() => router.push('/admin/(tabs)/orders')}
          style={[styles.callout, { backgroundColor: theme.primary, color: theme.primaryText }]}
        >
          {awaitingAttention} order{awaitingAttention === 1 ? '' : 's'} need attention
        </Text>
      ) : null}

      {data.payment_reconciliation_warning_count > 0 ? (
        <Text style={[styles.warningCallout, { backgroundColor: theme.danger }]}>
          {data.payment_reconciliation_warning_count} paid order
          {data.payment_reconciliation_warning_count === 1 ? '' : 's'} stuck pending for over 2 hours —
          needs review
        </Text>
      ) : null}

      {data.refund_pending_count > 0 ? (
        <Text style={[styles.warningCallout, { backgroundColor: theme.danger }]}>
          {data.refund_pending_count} order{data.refund_pending_count === 1 ? '' : 's'} owe a refund
        </Text>
      ) : null}

      <View style={styles.grid}>
        <StatCard label="Today's Orders" value={String(data.today_order_count)} theme={theme} />
        <StatCard label="New" value={String(data.pending_count)} theme={theme} />
        <StatCard
          label="Paid, Awaiting Acceptance"
          value={String(data.paid_awaiting_acceptance_count)}
          theme={theme}
        />
        <StatCard label="Accepted" value={String(data.accepted_count)} theme={theme} />
        <StatCard label="Preparing" value={String(data.preparing_count)} theme={theme} />
        <StatCard label="Out for Delivery" value={String(data.out_for_delivery_count)} theme={theme} />
        <StatCard label="Delivered" value={String(data.delivered_count)} theme={theme} />
        <StatCard
          label="Rejected / Cancelled"
          value={String(data.rejected_cancelled_count)}
          theme={theme}
        />
      </View>

      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Today&apos;s Revenue</Text>
      <View style={[styles.revenueCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <RevenueRow
          label="Order Value (placed today)"
          value={paiseToRupeesLabel(data.today_order_value_paise)}
          theme={theme}
        />
        <RevenueRow
          label="Online Payments Received"
          value={paiseToRupeesLabel(data.today_online_paid_paise)}
          theme={theme}
        />
        <RevenueRow
          label="COD Collected"
          value={paiseToRupeesLabel(data.today_cod_collected_paise)}
          theme={theme}
        />
        <RevenueRow
          label="Net Realized Receipts"
          value={paiseToRupeesLabel(data.today_net_realized_receipts_paise)}
          theme={theme}
          emphasis
        />
      </View>
      <Text style={[styles.note, { color: theme.textSecondary }]}>
        COD revenue above counts only orders marked collected (&quot;Record Cash Collected&quot; on a
        delivered COD order&apos;s detail screen) — a placed COD order isn&apos;t counted until then.
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Inventory</Text>
      <View style={styles.grid}>
        <StatCard label="Low Stock" value={String(data.low_stock_count)} theme={theme} warn />
        <StatCard label="Out of Stock" value={String(data.out_of_stock_count)} theme={theme} warn />
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  theme,
  warn,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>;
  warn?: boolean;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.statValue, { color: warn && value !== '0' ? theme.danger : theme.textPrimary }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

function RevenueRow({
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
    <View style={styles.revenueRow}>
      <Text style={[emphasis ? styles.revenueLabelStrong : styles.revenueLabel, { color: theme.textSecondary }]}>
        {label}
      </Text>
      <Text style={[emphasis ? styles.revenueValueStrong : styles.revenueValue, { color: theme.textPrimary }]}>
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
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
  },
  callout: {
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.bodyStrong,
    textAlign: 'center',
    overflow: 'hidden',
  },
  warningCallout: {
    borderRadius: radius.md,
    padding: spacing.md,
    color: '#fff',
    ...typography.bodyStrong,
    textAlign: 'center',
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    flexBasis: '47%',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  statValue: {
    ...typography.display,
  },
  statLabel: {
    ...typography.caption,
  },
  sectionTitle: {
    ...typography.h2,
    marginTop: spacing.sm,
  },
  revenueCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revenueLabel: {
    ...typography.caption,
  },
  revenueValue: {
    ...typography.caption,
  },
  revenueLabelStrong: {
    ...typography.bodyStrong,
  },
  revenueValueStrong: {
    ...typography.bodyStrong,
  },
  note: {
    ...typography.caption,
  },
});
