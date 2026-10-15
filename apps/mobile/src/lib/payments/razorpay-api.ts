import { supabase } from '@/lib/supabase/client';

type CreateRazorpayOrderResult = {
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string;
  orderNumber: string;
};

export async function createRazorpayOrder(orderId: string): Promise<CreateRazorpayOrderResult> {
  const { data, error } = await supabase.functions.invoke('razorpay-create-order', {
    body: { orderId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as CreateRazorpayOrderResult;
}

export async function verifyRazorpayPayment(params: {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<{ verified: boolean }> {
  const { data, error } = await supabase.functions.invoke('razorpay-verify-payment', {
    body: params,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { verified: boolean };
}
