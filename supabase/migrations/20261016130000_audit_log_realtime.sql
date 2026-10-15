-- Phase 7: publish admin_audit_logs for Realtime too, so the new admin
-- audit log viewer screen updates live when either admin takes an action
-- (same idempotent-add pattern as the Phase 6 migration).

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_audit_logs'
  ) then
    alter publication supabase_realtime add table public.admin_audit_logs;
  end if;
end;
$$;
