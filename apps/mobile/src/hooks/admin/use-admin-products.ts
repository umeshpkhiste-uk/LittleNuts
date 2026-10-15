import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Product } from '@littlenuts/shared';

import { supabase } from '@/lib/supabase/client';

export type ProductFormValues = {
  categoryId: string;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  pricePerKgPaise: number;
  minOrderWeightG: number;
  maxOrderWeightG: number | null;
  weightIncrementG: number;
  stockWeightG: number;
  reorderThresholdG: number;
  isActive: boolean;
  isFeatured: boolean;
  imageUrls: string[];
};

function toRow(values: ProductFormValues) {
  return {
    category_id: values.categoryId,
    name: values.name,
    slug: values.slug,
    sku: values.sku,
    short_description: values.shortDescription || null,
    description: values.description || null,
    price_per_kg_paise: values.pricePerKgPaise,
    min_order_weight_g: values.minOrderWeightG,
    max_order_weight_g: values.maxOrderWeightG,
    weight_increment_g: values.weightIncrementG,
    stock_weight_g: values.stockWeightG,
    reorder_threshold_g: values.reorderThresholdG,
    is_active: values.isActive,
    is_featured: values.isFeatured,
    image_urls: values.imageUrls,
  };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: ProductFormValues) => {
      const { data, error } = await supabase
        .from('products')
        .insert(toRow(values))
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: ProductFormValues }) => {
      const { data, error } = await supabase
        .from('products')
        .update(toRow(values))
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
}

// Goes through adjust_product_stock (not a raw table update) so every
// stock change is reasoned and recorded in inventory_movements.
export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      newStockWeightG,
      reason,
    }: {
      id: string;
      newStockWeightG: number;
      reason: string;
    }) => {
      const { data, error } = await supabase.rpc('adjust_product_stock', {
        p_product_id: id,
        p_new_stock_weight_g: newStockWeightG,
        p_reason: reason,
      });
      if (error) throw error;
      return data as Product;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
    },
  });
}
