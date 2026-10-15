import type { OrderStatus, PaymentStatus } from '@littlenuts/shared';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready_for_dispatch: 'Ready for Dispatch',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Payment Pending',
  authorized: 'Payment Authorized',
  paid: 'Paid',
  failed: 'Payment Failed',
  cancelled: 'Payment Cancelled',
  refund_pending: 'Refund Pending',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};

export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready_for_dispatch',
  'out_for_delivery',
  'delivered',
];
