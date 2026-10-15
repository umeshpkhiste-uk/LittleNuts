import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addToCart,
  clearCart,
  fetchCartItems,
  getOrCreateCartId,
  removeCartItem,
  setCartItemQuantity,
} from '@/hooks/cart/cart-api';
import { useAuthStore } from '@/stores/auth-store';

function useCartUserId() {
  return useAuthStore((state) => state.session?.user.id);
}

export function useCart() {
  const userId = useCartUserId();

  return useQuery({
    queryKey: ['cart', userId],
    queryFn: async () => {
      const cartId = await getOrCreateCartId(userId!);
      const items = await fetchCartItems(cartId);
      return { cartId, items };
    },
    enabled: !!userId,
  });
}

function useCartMutation<TVariables>(
  mutationFn: (cartId: string, variables: TVariables) => Promise<void>,
) {
  const userId = useCartUserId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      const cartId = await getOrCreateCartId(userId!);
      await mutationFn(cartId, variables);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart', userId] });
    },
  });
}

export function useAddToCart() {
  return useCartMutation<{ productId: string; quantityG: number }>((cartId, { productId, quantityG }) =>
    addToCart(cartId, productId, quantityG),
  );
}

export function useSetCartItemQuantity() {
  return useCartMutation<{ cartItemId: string; quantityG: number }>((_cartId, { cartItemId, quantityG }) =>
    setCartItemQuantity(cartItemId, quantityG),
  );
}

export function useRemoveCartItem() {
  return useCartMutation<{ cartItemId: string }>((_cartId, { cartItemId }) =>
    removeCartItem(cartItemId),
  );
}

export function useClearCart() {
  return useCartMutation<void>((cartId) => clearCart(cartId));
}
