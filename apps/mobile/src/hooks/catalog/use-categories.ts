import { useQuery } from '@tanstack/react-query';
import type { Category } from '@littlenuts/shared';

import { supabase } from '@/lib/supabase/client';

export function useCategories(options: { includeInactive?: boolean } = {}) {
  const { includeInactive = false } = options;

  return useQuery({
    queryKey: ['categories', { includeInactive }],
    queryFn: async () => {
      let query = supabase.from('categories').select('*');
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query.order('sort_order');
      if (error) throw error;
      return data as Category[];
    },
  });
}
