import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Order, PaymentMethod } from '@littlenuts/shared';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

type CreateOrderInput = {
  addressId: string;
  paymentMethod: PaymentMethod;
  idempotencyKey: string;
  customerNotes?: string;
};

// Thin wrapper around the public.create_order() RPC (see
// supabase/migrations/20261015192101_orders_and_payments.sql) — all
// validation and pricing happens server-side; this just shapes the call
// and invalidates client caches afterward.
export function useCreateOrder() {
  const userId = useAuthStore((state) => state.session?.user.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateOrderInput) => {
      const { data, error } = await supabase.rpc('create_order', {
        p_address_id: input.addressId,
        p_payment_method: input.paymentMethod,
        p_idempotency_key: input.idempotencyKey,
        p_customer_notes: input.customerNotes ?? null,
      });
      if (error) throw error;
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', userId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
