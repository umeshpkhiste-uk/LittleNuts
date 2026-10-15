import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

// Subscribes to Postgres changes on `table` and invalidates the given
// query keys whenever a row changes, so every screen watching that data
// (e.g. both admins' order lists) stays in sync without manual refresh or
// polling. RLS on the underlying table still governs which rows a given
// subscriber actually receives change events for.
export function useRealtimeInvalidate(table: string, queryKeys: QueryKey[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => {
          queryKeys.forEach((key) => queryClient.invalidateQueries({ queryKey: key }));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, JSON.stringify(queryKeys)]);
}
