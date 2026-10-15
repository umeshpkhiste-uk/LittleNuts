// Called by the admin app after initiate_refund() (a SECURITY DEFINER DB
// function) has already created the `refunds` row and flipped the order
// to 'refund_pending'. This function's only job is the actual Razorpay API
// call — it needs the Razorpay secret, which only lives in Edge Function
// environment variables, never in Postgres or the mobile app.
//
// Razorpay's refund API response can report the refund as already
// 'processed' (instant refunds) or still 'pending' (will complete async,
// confirmed later by the refund.processed/refund.failed webhook — see
// razorpay-webhook). Either way this function records whatever Razorpay
// told it synchronously; the webhook is the authoritative confirmation
// path, exactly like the create-order/verify-payment + webhook pattern
// used for payments.
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { notify } from '../_shared/notify.ts';

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

    const { refundId } = await req.json();
    if (!refundId || typeof refundId !== 'string') {
      return jsonResponse({ error: 'refundId is required' }, 400);
    }

    // User-scoped client: the refunds_select_own_or_admin RLS policy means
    // a non-admin caller simply won't find this row (not even for their
    // own order — refunds are admin-initiated only), which is exactly the
    // access check this function needs before it spends real money.
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Explicit admin check — refunds_select_own_or_admin also lets the
    // order's own customer read a refund row, but only an admin may ever
    // trigger the actual money movement below.
    const { data: role } = await userClient.from('user_roles').select('role').single();
    if (role?.role !== 'admin') {
      return jsonResponse({ error: 'Admin privileges required' }, 403);
    }

    const { data: refund, error: refundError } = await userClient
      .from('refunds')
      .select('id, order_id, amount_paise, status, payment_attempt_id')
      .eq('id', refundId)
      .single();
    if (refundError || !refund) {
      return jsonResponse({ error: 'Refund not found' }, 404);
    }
    if (refund.status !== 'pending') {
      return jsonResponse({ error: `Refund is already ${refund.status}` }, 409);
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: attempt } = await serviceClient
      .from('payment_attempts')
      .select('provider_payment_id')
      .eq('id', refund.payment_attempt_id)
      .single();
    if (!attempt?.provider_payment_id) {
      return jsonResponse({ error: 'No Razorpay payment id on record for this refund' }, 400);
    }

    const razorpayResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${attempt.provider_payment_id}/refund`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`)}`,
        },
        body: JSON.stringify({
          amount: refund.amount_paise,
          speed: 'normal',
          notes: { littlenuts_refund_id: refund.id, littlenuts_order_id: refund.order_id },
        }),
      },
    );

    if (!razorpayResponse.ok) {
      const errorBody = await razorpayResponse.text();
      console.error('Razorpay refund request failed', razorpayResponse.status, errorBody);
      await serviceClient
        .from('refunds')
        .update({ status: 'failed', failure_reason: `Razorpay error: ${razorpayResponse.status}` })
        .eq('id', refund.id);
      return jsonResponse({ error: 'Payment gateway error' }, 502);
    }

    const razorpayRefund = await razorpayResponse.json();
    const isProcessed = razorpayRefund.status === 'processed';

    await serviceClient
      .from('refunds')
      .update({
        status: isProcessed ? 'processed' : 'processing',
        provider_refund_id: razorpayRefund.id,
        processed_at: isProcessed ? new Date().toISOString() : null,
      })
      .eq('id', refund.id);

    if (isProcessed) {
      const { data: order } = await serviceClient
        .from('orders')
        .select('id, user_id, order_number, total_paise')
        .eq('id', refund.order_id)
        .single();

      if (order) {
        const { data: processedRefunds } = await serviceClient
          .from('refunds')
          .select('amount_paise')
          .eq('order_id', order.id)
          .eq('status', 'processed');
        const totalRefunded = (processedRefunds ?? []).reduce((sum, r) => sum + r.amount_paise, 0);
        const newStatus = totalRefunded >= order.total_paise ? 'refunded' : 'partially_refunded';

        await serviceClient.from('orders').update({ payment_status: newStatus }).eq('id', order.id);
        await notify(
          serviceClient,
          order.user_id,
          'refund_processed',
          'Refund processed',
          `A refund of ${(refund.amount_paise / 100).toFixed(2)} for order ${order.order_number} has been processed.`,
          order.id,
        );
      }
    }

    return jsonResponse({ status: isProcessed ? 'processed' : 'processing', providerRefundId: razorpayRefund.id });
  } catch (error) {
    console.error('razorpay-refund error', error);
    return jsonResponse({ error: 'Internal error' }, 500);
  }
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
