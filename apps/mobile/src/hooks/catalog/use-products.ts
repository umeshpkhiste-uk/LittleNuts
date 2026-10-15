import { useQuery } from '@tanstack/react-query';
import type { Product } from '@littlenuts/shared';

import { supabase } from '@/lib/supabase/client';

export type ProductsFilter = {
  categoryId?: string;
  search?: string;
  featuredOnly?: boolean;
  includeInactive?: boolean;
};

export function useProducts(filter: ProductsFilter = {}) {
  return useQuery({
    queryKey: ['products', filter],
    queryFn: async () => {
      let query = supabase.from('products').select('*');
      if (!filter.includeInactive) {
        query = query.eq('is_active', true);
      }

      if (filter.categoryId) {
        query = query.eq('category_id', filter.categoryId);
      }
      if (filter.featuredOnly) {
        query = query.eq('is_featured', true);
      }
      if (filter.search?.trim()) {
        query = query.ilike('name', `%${filter.search.trim()}%`);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data as Product[];
    },
  });
}

export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId!)
        .single();
      if (error) throw error;
      return data as Product;
    },
    enabled: !!productId,
  });
}
