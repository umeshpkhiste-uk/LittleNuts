import { useLocalSearchParams } from 'expo-router';

import { OrderDetailsScreen } from '@/screens/order-details';

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrderDetailsScreen orderId={id!} />;
}
