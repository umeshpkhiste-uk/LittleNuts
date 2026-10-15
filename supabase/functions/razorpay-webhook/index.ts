// Public endpoint — Razorpay calls this directly from their servers, so it
// is deployed with --no-verify-jwt (no Supabase session exists for this
// caller) and authenticates purely via the Razorpay webhook signature.
// This is the authoritative async confirmation path required by spec
// section 10: if the customer pays but never returns to the app, this is
// what still marks the order paid.
//
// Signature + dedup per Razorpay's current docs (verified 2026-10-16,
// https://razorpay.com/docs/webhooks/validate-test/ and
// .../webhooks/payloads/payments/):
//   - X-Razorpay-Signature: HMAC-SHA256(raw body, webhook secret), hex.
//     MUST be computed over the raw, unparsed body — re-serializing JSON
//     can produce a different signature.
//   - X-Razorpay-Event-Id: unique per delivery; Razorpay says to expect
//     and handle duplicate deliveries using this.
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { corsHeaders } from '../_shared/cors.ts';
import { hmacSha256Hex, timingSafeEqual } from '../_shared/hmac.ts';
import { notify } from '../_shared/notify.ts';

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');
  const eventId = req.headers.get('x-razorpay-event-id');

  if (!signature || !eventId) {
    return new Response('Missing signature headers', { status: 400 });
  }

  const expectedSignature = await hmacSha256Hex(rawBody, RAZORPAY_WEBHOOK_SECRET);
  if (!timingSafeEqual(expectedSignature, signature)) {
    console.error('razorpay-webhook: signature mismatch');
    return new Response('Invalid signature', { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Record the delivery first, keyed on the unique event id, so a
  // duplicate delivery (Razorpay explicitly says to expect these) is a
  // no-op rather than double-processing.
  const { error: insertError } = await supabase.from('payment_webhook_events').insert({
    provider: 'razorpay',
    provider_event_id: eventId,
    event_type: null,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      // Unique violation on (provider, provider_event_id) — already seen.
      return new Response('OK (duplicate)', { status: 200 });
    }
    console.error('razorpay-webhook: failed to record event', insertError);
    return new Response('Internal error', { status: 500 });
  }

  let payload: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string } };
      refund?: { entity?: { id?: string; payment_id?: string; status?: string } };
    };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    await markEvent(supabase, eventId, null, 'failed');
    return new Response('Invalid JSON', { status: 400 });
  }

  const eventType = payload.event ?? null;
  const paymentEntity = payload.payload?.payment?.entity;
  const refundEntity = payload.payload?.refund?.entity;

  try {
    if (eventType === 'payment.captured' && paymentEntity?.order_id && paymentEntity.id) {
      await handlePaymentCaptured(supabase, paymentEntity.order_id, paymentEntity.id);
    } else if (eventType === 'payment.failed' && paymentEntity?.order_id) {
      await handlePaymentFailed(supabase, paymentEntity.order_id);
    } else if (eventType === 'refund.processed' && refundEntity?.id) {
      await handleRefundProcessed(supabase, refundEntity.id);
    } else if (eventType === 'refund.failed' && refundEntity?.id) {
      await handleRefundFailed(supabase, refundEntity.id);
    }

    await markEvent(supabase, eventId, eventType, 'processed');
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('razorpay-webhook: processing failed', error);
    await markEvent(supabase, eventId, eventType, 'failed');
    // Still 200: we've durably recorded the event and can reprocess it
    // from payment_webhook_events later. Returning an error status here
    // would just make Razorpay retry a delivery we already stored.
    return new Response('Recorded, processing failed', { status: 200 });
  }
});

async function handlePaymentCaptured(
  supabase: ReturnType<typeof createClient>,
  razorpayOrderId: string,
  razorpayPaymentId: string,
) {
  const { data: attempt } = await supabase
    .from('payment_attempts')
    .select('id, order_id, status')
    .eq('provider', 'razorpay')
    .eq('provider_order_id', razorpayOrderId)
    .maybeSingle();

  if (!attempt) {
    console.error('razorpay-webhook: no payment_attempts row for order', razorpayOrderId);
    return;
  }

  if (attempt.status !== 'paid') {
    await supabase
      .from('payment_attempts')
      .update({
        status: 'paid',
        provider_payment_id: razorpayPaymentId,
        verified_at: new Date().toISOString(),
      })
      .eq('id', attempt.id);
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id, order_number, payment_status')
    .eq('id', attempt.order_id)
    .single();

  if (order && order.payment_status !== 'paid') {
    await supabase.from('orders').update({ payment_status: 'paid' }).eq('id', order.id);
    await notify(
      supabase,
      order.user_id,
      'payment_success',
      'Payment successful',
      `Payment received for order ${order.order_number}.`,
      order.id,
    );
  }
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  razorpayOrderId: string,
) {
  const { data: attempt } = await supabase
    .from('payment_attempts')
    .select('id, order_id, status')
    .eq('provider', 'razorpay')
    .eq('provider_order_id', razorpayOrderId)
    .maybeSingle();

  if (!attempt || attempt.status === 'paid') return;

  await supabase
    .from('payment_attempts')
    .update({ status: 'failed', failure_reason: 'Payment failed (webhook)' })
    .eq('id', attempt.id);

  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id, order_number')
    .eq('id', attempt.order_id)
    .single();

  if (order) {
    await notify(
      supabase,
      order.user_id,
      'payment_failed',
      'Payment failed',
      `Your payment for order ${order.order_number} failed.`,
      order.id,
    );
  }
}

async function handleRefundProcessed(supabase: ReturnType<typeof createClient>, refundId: string) {
  const { data: refund } = await supabase
    .from('refunds')
    .select('id, order_id, status')
    .eq('provider_refund_id', refundId)
    .maybeSingle();
  if (!refund || refund.status === 'processed') return;

  await supabase
    .from('refunds')
    .update({ status: 'processed', processed_at: new Date().toISOString() })
    .eq('id', refund.id);

  await reconcileOrderRefundStatus(supabase, refund.order_id);
}

async function handleRefundFailed(supabase: ReturnType<typeof createClient>, refundId: string) {
  const { data: refund } = await supabase
    .from('refunds')
    .select('id, order_id, status')
    .eq('provider_refund_id', refundId)
    .maybeSingle();
  if (!refund || refund.status === 'processed' || refund.status === 'failed') return;

  await supabase.from('refunds').update({ status: 'failed' }).eq('id', refund.id);

  await reconcileOrderRefundStatus(supabase, refund.order_id);
}

// Recomputes an order's payment_status from the sum of its *processed*
// refunds vs. the order total — the single source of truth both the
// webhook and the razorpay-refund function use, so they can never
// disagree about whether an order is now 'refunded' vs
// 'partially_refunded' vs still 'paid'.
async function reconcileOrderRefundStatus(supabase: ReturnType<typeof createClient>, orderId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id, order_number, total_paise, payment_status')
    .eq('id', orderId)
    .single();
  if (!order) return;

  const { data: processedRefunds } = await supabase
    .from('refunds')
    .select('amount_paise')
    .eq('order_id', orderId)
    .eq('status', 'processed');

  const totalRefunded = (processedRefunds ?? []).reduce((sum, r) => sum + r.amount_paise, 0);

  let newStatus = order.payment_status;
  if (totalRefunded >= order.total_paise && totalRefunded > 0) {
    newStatus = 'refunded';
  } else if (totalRefunded > 0) {
    newStatus = 'partially_refunded';
  }

  if (newStatus !== order.payment_status) {
    await supabase.from('orders').update({ payment_status: newStatus }).eq('id', orderId);
    await notify(
      supabase,
      order.user_id,
      'refund_processed',
      'Refund processed',
      `A refund of ${totalRefunded / 100} for order ${order.order_number} has been processed.`,
      orderId,
    );
  }
}

async function markEvent(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  eventType: string | null,
  status: 'processed' | 'failed',
) {
  await supabase
    .from('payment_webhook_events')
    .update({ event_type: eventType, processing_status: status, processed_at: new Date().toISOString() })
    .eq('provider', 'razorpay')
    .eq('provider_event_id', eventId);
}
