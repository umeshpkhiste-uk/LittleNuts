import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Order, OrderItem, OrderStatus } from '@littlenuts/shared';

import { supabase } from '@/lib/supabase/client';

export type AdminOrderTab =
  | 'new'
  | 'paid_awaiting_acceptance'
  | 'accepted'
  | 'preparing'
  | 'ready_for_dispatch'
  | 'out_for_delivery'
  | 'delivered'
  | 'rejected_cancelled'
  | 'all';

export type AdminOrder = Order & { customer_name: string | null };

export function useAdminOrders(tab: AdminOrderTab) {
  return useQuery({
    queryKey: ['admin-orders', tab],
    queryFn: async () => {
      const base = supabase.from('orders').select('*').order('created_at', { ascending: false });

      const { data, error } = await (tab === 'new'
        ? base.eq('status', 'pending').neq('payment_status', 'paid')
        : tab === 'paid_awaiting_acceptance'
          ? base.eq('status', 'pending').eq('payment_status', 'paid')
          : tab === 'rejected_cancelled'
            ? base.in('status', ['rejected', 'cancelled'])
            : tab === 'all'
              ? base
              : base.eq('status', tab));
      if (error) throw error;
      const orders = data as Order[];

      // orders.user_id and profiles.id both reference auth.users but
      // aren't FK'd to each other, so PostgREST can't embed profiles
      // directly — fetch them separately and merge client-side.
      const userIds = [...new Set(orders.map((o) => o.user_id))];
      const { data: profiles } = userIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
        : { data: [] as { id: string; full_name: string | null }[] };
      const nameByUserId = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

      return orders.map((order) => ({
        ...order,
        customer_name: nameByUserId.get(order.user_id) ?? null,
      })) as AdminOrder[];
    },
  });
}

export function useAdminOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['admin-order', orderId],
    queryFn: async () => {
      const [{ data: order, error: orderError }, { data: items, error: itemsError }] =
        await Promise.all([
          supabase.from('orders').select('*').eq('id', orderId!).single(),
          supabase.from('order_items').select('*').eq('order_id', orderId!).order('created_at'),
        ]);
      if (orderError) throw orderError;
      if (itemsError) throw itemsError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone_number')
        .eq('id', (order as Order).user_id)
        .maybeSingle();

      return {
        order: order as Order,
        items: items as OrderItem[],
        customerName: profile?.full_name ?? null,
        customerPhone: profile?.phone_number ?? null,
      };
    },
    enabled: !!orderId,
  });
}

function useInvalidateOrderQueries() {
  const queryClient = useQueryClient();
  return (orderId: string) => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    queryClient.invalidateQueries({ queryKey: ['admin-order', orderId] });
    queryClient.invalidateQueries({ queryKey: ['order', orderId] });
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };
}

export function useAcceptOrder() {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('accept_order', { p_order_id: orderId });
      if (error) throw error;
      return data as Order;
    },
    onSuccess: (_data, orderId) => invalidate(orderId),
  });
}

export function useRejectOrder() {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { data, error } = await supabase.rpc('reject_order', {
        p_order_id: orderId,
        p_reason: reason,
      });
      if (error) throw error;
      return data as Order;
    },
    onSuccess: (_data, variables) => invalidate(variables.orderId),
  });
}

export function useAdminCancelOrder() {
  const invalidate = useInvalidateOrderQueries();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const { data, error } = await supabase.rpc('admin_cancel_order', {
        p_order_id: orderId,
        p_reason: reason,
      });
      if (error) throw error;
      return data as Order;
    },
    onSuccess: (_data, variables) => {
      invalidate(variables.orderId);
      // Cancelling restores stock, so product listings/stock figures go stale too.
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const invalidate = useInvalidateOrderQueries();
  return useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: OrderStatus }) => {
      const { data, error } = await supabase.rpc('update_order_status', {
        p_order_id: orderId,
        p_new_status: newStatus,
      });
      if (error) throw error;
      return data as Order;
    },
    onSuccess: (_data, variables) => invalidate(variables.orderId),
  });
}
