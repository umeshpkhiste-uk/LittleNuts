import { useQuery } from '@tanstack/react-query';
import type { Order, OrderItem } from '@littlenuts/shared';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

export function useMyOrders() {
  const userId = useAuthStore((state) => state.session?.user.id);
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!userId,
  });
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const [{ data: order, error: orderError }, { data: items, error: itemsError }] =
        await Promise.all([
          supabase.from('orders').select('*').eq('id', orderId!).single(),
          supabase.from('order_items').select('*').eq('order_id', orderId!).order('created_at'),
        ]);
      if (orderError) throw orderError;
      if (itemsError) throw itemsError;
      return { order: order as Order, items: items as OrderItem[] };
    },
    enabled: !!orderId,
  });
}
