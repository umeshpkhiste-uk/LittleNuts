import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';

export type Favorite = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

function useUserId() {
  return useAuthStore((state) => state.session?.user.id);
}

export function useFavorites() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!userId,
  });
}

export function useIsFavorite(productId: string) {
  const favorites = useFavorites();
  return favorites.data?.some((favorite) => favorite.product_id === productId) ?? false;
}

export function useAddFavorite() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, product_id: productId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });
}

export function useRemoveFavorite() {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', userId] });
    },
  });
}
