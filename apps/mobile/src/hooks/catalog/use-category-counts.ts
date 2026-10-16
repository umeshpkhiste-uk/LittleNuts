import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

// Lightweight count-per-category map for the Categories grid's "N items"
// subtitle — only pulls category_id rather than full product rows.
export function useCategoryProductCounts() {
  return useQuery({
    queryKey: ['category-product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category_id')
        .eq('is_active', true);
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data as { category_id: string }[]) {
        counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
      }
      return counts;
    },
  });
}
