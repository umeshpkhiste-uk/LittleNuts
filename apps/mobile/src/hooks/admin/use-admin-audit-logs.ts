import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

export type AdminAuditLog = {
  id: string;
  admin_user_id: string;
  admin_name: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function useAdminAuditLogs() {
  return useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;

      const logs = data as Omit<AdminAuditLog, 'admin_name'>[];
      const adminIds = [...new Set(logs.map((l) => l.admin_user_id))];
      const { data: profiles } = adminIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', adminIds)
        : { data: [] as { id: string; full_name: string | null }[] };
      const nameByAdminId = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

      return logs.map((log) => ({
        ...log,
        admin_name: nameByAdminId.get(log.admin_user_id) ?? null,
      })) as AdminAuditLog[];
    },
    refetchInterval: 60_000,
  });
}
