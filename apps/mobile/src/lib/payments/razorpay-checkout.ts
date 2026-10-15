// react-native-razorpay ships no real TypeScript types (just an ambient
// `declare module` disabling checking), so this file is the one place
// that `any`-typed import is isolated and given a proper shape.
import RazorpayCheckoutNative from 'react-native-razorpay';

export type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { email?: string; contact?: string; name?: string };
  theme?: { color?: string };
};

export type RazorpayCheckoutSuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayCheckoutError = {
  code: number;
  description: string;
};

const RazorpayCheckout = RazorpayCheckoutNative as {
  open: (options: RazorpayCheckoutOptions) => Promise<RazorpayCheckoutSuccess>;
};

export async function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
): Promise<RazorpayCheckoutSuccess> {
  try {
    return await RazorpayCheckout.open(options);
  } catch (error) {
    const rzpError = error as RazorpayCheckoutError;
    throw new Error(rzpError?.description || 'Payment was not completed.');
  }
}
