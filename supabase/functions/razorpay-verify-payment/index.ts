// Verifies a Razorpay checkout result using the documented signature
// procedure (HMAC-SHA256 of "{razorpay_order_id}|{razorpay_payment_id}"
// with the key secret) and ONLY marks an order paid if that verification
// passes. The mobile app's "success" callback from the Razorpay SDK is
// never trusted on its own (spec section 10: "The backend must not trust
// a client-provided amount, payment status, payment identifier, or
// success callback") — this is the trusted recomputation. The webhook
// function provides the second, asynchronous confirmation path for cases
// where the customer never returns to the app.
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { hmacSha256Hex, timingSafeEqual } from '../_shared/hmac.ts';

const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return jsonResponse({ error: 'Missing required fields' }, 400);
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: order, error: orderError } = await userClient
      .from('orders')
      .select('id, user_id, order_number, payment_status')
      .eq('id', orderId)
      .single();
    if (orderError || !order) {
      return jsonResponse({ error: 'Order not found' }, 404);
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: attempt, error: attemptError } = await serviceClient
      .from('payment_attempts')
      .select('id, amount_paise')
      .eq('order_id', orderId)
      .eq('provider_order_id', razorpayOrderId)
      .maybeSingle();
    if (attemptError || !attempt) {
      return jsonResponse({ error: 'Payment attempt not found' }, 404);
    }

    const expectedSignature = await hmacSha256Hex(
      `${razorpayOrderId}|${razorpayPaymentId}`,
      RAZORPAY_KEY_SECRET,
    );
    const isValid = timingSafeEqual(expectedSignature, razorpaySignature);

    if (!isValid) {
      await serviceClient
        .from('payment_attempts')
        .update({ status: 'failed', failure_reason: 'Signature verification failed' })
        .eq('id', attempt.id);
      await notify(
        serviceClient,
        order.user_id,
        'payment_failed',
        'Payment failed',
        `We couldn't verify your payment for order ${order.order_number}. Please try again.`,
        orderId,
      );
      return jsonResponse({ error: 'Signature verification failed', verified: false }, 400);
    }

    // Idempotent: if a prior call (or the webhook) already verified this
    // attempt, this just re-confirms the same state rather than erroring —
    // including not sending a second "payment success" notification.
    const wasAlreadyPaid = order.payment_status === 'paid';

    await serviceClient
      .from('payment_attempts')
      .update({
        status: 'paid',
        provider_payment_id: razorpayPaymentId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', attempt.id);

    if (!wasAlreadyPaid) {
      await serviceClient.from('orders').update({ payment_status: 'paid' }).eq('id', orderId);
      await notify(
        serviceClient,
        order.user_id,
        'payment_success',
        'Payment successful',
        `Payment received for order ${order.order_number}.`,
        orderId,
      );
    }

    return jsonResponse({ verified: true });
  } catch (error) {
    console.error('razorpay-verify-payment error', error);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function notify(
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
