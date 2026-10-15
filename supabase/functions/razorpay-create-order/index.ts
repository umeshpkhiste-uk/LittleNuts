// Creates (or reuses) a Razorpay order for an already-created LittleNuts
// order. This is the only place the Razorpay key SECRET is used — it lives
// in this function's environment (set via `supabase secrets set`), never
// in the mobile app. The caller's identity comes from their own JWT (not
// a client-supplied user id), and the order lookup uses a user-scoped
// Supabase client so RLS guarantees they can only act on their own order.
//
// Per spec section 10's required flow: the mobile app has already called
// create_order (customer confirms cart+address, backend validates and
// computes the authoritative total); this function's only job is turning
// that already-validated order into a Razorpay order to open checkout
// with. It never recomputes pricing — orders.total_paise is already
// authoritative.
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
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

    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== 'string') {
      return jsonResponse({ error: 'orderId is required' }, 400);
    }

    // User-scoped client: RLS (orders_select_own_or_admin) ensures this
    // can only ever return the caller's own order.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: order, error: orderError } = await userClient
      .from('orders')
      .select('id, order_number, payment_method, payment_status, total_paise')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return jsonResponse({ error: 'Order not found' }, 404);
    }
    if (order.payment_method !== 'razorpay') {
      return jsonResponse({ error: 'Order is not set up for online payment' }, 400);
    }
    if (order.payment_status === 'paid') {
      return jsonResponse({ error: 'Order is already paid' }, 409);
    }

    // Service-role client: payment_attempts has no authenticated write
    // policy by design (see supabase/migrations), so only this
    // service-role connection can write it.
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: existingAttempt } = await serviceClient
      .from('payment_attempts')
      .select('provider_order_id, amount_paise, status')
      .eq('order_id', order.id)
      .not('status', 'in', '(failed,cancelled)')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingAttempt?.provider_order_id) {
      return jsonResponse({
        razorpayOrderId: existingAttempt.provider_order_id,
        amountPaise: existingAttempt.amount_paise,
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID,
        orderNumber: order.order_number,
      });
    }

    const razorpayResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
      },
      body: JSON.stringify({
        amount: order.total_paise,
        currency: 'INR',
        receipt: order.order_number,
        notes: { littlenuts_order_id: order.id },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorBody = await razorpayResponse.text();
      console.error('Razorpay order creation failed', razorpayResponse.status, errorBody);
      return jsonResponse({ error: 'Payment gateway error' }, 502);
    }

    const razorpayOrder = await razorpayResponse.json();

    const attemptIdempotencyKey = `${order.id}:${razorpayOrder.id}`;
    const { error: insertError } = await serviceClient.from('payment_attempts').insert({
      order_id: order.id,
      provider: 'razorpay',
      provider_order_id: razorpayOrder.id,
      amount_paise: order.total_paise,
      currency: 'INR',
      status: 'created',
      idempotency_key: attemptIdempotencyKey,
    });

    if (insertError) {
      console.error('Failed to record payment attempt', insertError);
      return jsonResponse({ error: 'Could not record payment attempt' }, 500);
    }

    return jsonResponse({
      razorpayOrderId: razorpayOrder.id,
      amountPaise: order.total_paise,
      currency: 'INR',
      keyId: RAZORPAY_KEY_ID,
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error('razorpay-create-order error', error);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
