// react-native-razorpay ships no `types` field in package.json, so
// TypeScript can't find its (unpublished) ambient declaration on its own.
// The real shape is defined in src/lib/payments/razorpay-checkout.ts —
// this just lets the bare import resolve.
declare module 'react-native-razorpay';
