import type { CartItemWithProduct } from '@littlenuts/shared';

import { supabase } from '@/lib/supabase/client';

// Lazily creates the current user's cart on first use. One cart per user
// (unique constraint on carts.user_id) — upsert makes "get or create"
// idempotent and race-safe under RLS (the user can only ever touch their
// own row, so a duplicate concurrent upsert just resolves to the same row).
export async function getOrCreateCartId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('carts')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function fetchCartItems(cartId: string): Promise<CartItemWithProduct[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, product:products(*)')
    .eq('cart_id', cartId)
    .order('created_at');
  if (error) throw error;
  return data as unknown as CartItemWithProduct[];
}

// Adding to the cart never touches products.stock_weight_g (spec section
// 9: "The cart is not a stock reservation") — this only ever writes
// cart_items. If the product is already in the cart, the quantities are
// combined into the existing row rather than creating a duplicate (spec:
// "Avoid duplicate cart rows for the same product").
export async function addToCart(
  cartId: string,
  productId: string,
  quantityG: number,
): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('cart_items')
    .select('id, quantity_g')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .maybeSingle();
  if (fetchError) throw fetchError;

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity_g: existing.quantity_g + quantityG })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({ cart_id: cartId, product_id: productId, quantity_g: quantityG });
    if (error) throw error;
  }
}

export async function setCartItemQuantity(
  cartItemId: string,
  quantityG: number,
): Promise<void> {
  if (quantityG <= 0) {
    await removeCartItem(cartItemId);
    return;
  }
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity_g: quantityG })
    .eq('id', cartItemId);
  if (error) throw error;
}

export async function removeCartItem(cartItemId: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);
  if (error) throw error;
}

export async function clearCart(cartId: string): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
  if (error) throw error;
}
