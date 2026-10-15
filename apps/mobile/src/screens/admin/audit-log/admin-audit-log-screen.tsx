import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAdminAuditLogs } from '@/hooks/admin/use-admin-audit-logs';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';
import { useAppTheme } from '@/theme/theme-provider';
import { radius, spacing, typography } from '@/theme/tokens';

const ACTION_LABELS: Record<string, string> = {
  accept_order: 'Accepted order',
  reject_order: 'Rejected order',
  update_order_status: 'Updated order status',
  admin_cancel_order: 'Cancelled order',
  adjust_product_stock: 'Adjusted stock',
  initiate_refund: 'Initiated refund',
  record_cod_collection: 'Recorded COD collection',
};

export function AdminAuditLogScreen() {
  const theme = useAppTheme();
  const { data, isLoading } = useAdminAuditLogs();

  useRealtimeInvalidate('admin_audit_logs', [['admin-audit-logs']]);

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.textPrimary }]}>Audit Log</Text>
      <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
        Most recent 100 admin actions — accept/reject/status/cancel/stock/refund/COD events.
      </Text>

      {data?.length ? (
        data.map((log) => (
          <View key={log.id} style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.action, { color: theme.textPrimary }]}>
              {ACTION_LABELS[log.action] ?? log.action}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {log.admin_name ?? 'Admin'} · {new Date(log.created_at).toLocaleString('en-IN')}
            </Text>
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {log.entity_type}
              {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ''}
            </Text>
            {log.metadata ? (
              <Text style={[styles.metadata, { color: theme.textSecondary }]}>
                {JSON.stringify(log.metadata)}
              </Text>
            ) : null}
          </View>
        ))
      ) : (
        <Text style={[styles.meta, { color: theme.textSecondary }]}>No admin actions yet.</Text>
      )}
    </ScrollView>
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
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  row: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  action: {
    ...typography.bodyStrong,
  },
  meta: {
    ...typography.caption,
  },
  metadata: {
    ...typography.caption,
    fontFamily: 'monospace',
  },
});
