import { createClient } from 'jsr:@supabase/supabase-js@2';

// Shared across Edge Functions that insert customer notifications with a
// service-role client (notifications has no authenticated insert policy).
export async function notify(
  client: ReturnType<typeof createClient>,
  userId: string,
  type: string,
  title: string,
  message: string,
  orderId: string,
) {
  const { error } = await client
    .from('notifications')
    .insert({ user_id: userId, type, title, message, related_order_id: orderId });
  if (error) console.error('Failed to insert notification', error);
}
