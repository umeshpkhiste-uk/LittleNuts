import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

export type RecipientType = 'own' | 'other';

export type Address = {
  id: string;
  user_id: string;
  recipient_name: string;
  phone_number: string;
  address_line_1: string;
  address_line_2: string | null;
  area: string | null;
  city: string;
  state: string;
  postal_code: string;
  delivery_instructions: string | null;
  recipient_type: RecipientType;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type AddressInput = Omit<
  Address,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;

function useUserId() {
  return useAuthStore((state) => state.session?.user.id);
}

export function useAddresses() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['addresses', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Address[];
    },
    enabled: !!userId,
  });
}

export function useCreateAddress() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddressInput) => {
      const { data, error } = await supabase
        .from('addresses')
        .insert({ ...input, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data as Address;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', userId] });
    },
  });
}

export function useDeleteAddress() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', userId] });
    },
  });
}

export function useSetDefaultAddress() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // The addresses_single_default trigger (see supabase/migrations)
      // unsets any other default for this user automatically.
      const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses', userId] });
    },
  });
}
