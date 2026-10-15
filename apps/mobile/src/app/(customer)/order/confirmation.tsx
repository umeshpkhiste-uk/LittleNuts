import { useLocalSearchParams } from 'expo-router';

import { OrderConfirmationScreen } from '@/screens/order-confirmation';

export default function OrderConfirmation() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return <OrderConfirmationScreen orderId={orderId!} />;
}
