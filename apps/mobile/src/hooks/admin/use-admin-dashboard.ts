import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

export type AdminDashboardSummary = {
  today_order_count: number;
  pending_count: number;
  paid_awaiting_acceptance_count: number;
  accepted_count: number;
  preparing_count: number;
  ready_for_dispatch_count: number;
  out_for_delivery_count: number;
  delivered_count: number;
  rejected_cancelled_count: number;
  today_order_value_paise: number;
  today_online_paid_paise: number;
  today_cod_collected_paise: number;
  today_net_realized_receipts_paise: number;
  low_stock_count: number;
  out_of_stock_count: number;
  payment_reconciliation_warning_count: number;
  refund_pending_count: number;
};

export function useAdminDashboardSummary() {
  return useQuery({
    queryKey: ['admin-dashboard-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_dashboard_summary').single();
      if (error) throw error;
      return data as AdminDashboardSummary;
    },
    refetchInterval: 60_000,
  });
}
