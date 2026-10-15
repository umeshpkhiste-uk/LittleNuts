import { useLocalSearchParams } from 'expo-router';

import { AdminOrderDetailScreen } from '@/screens/admin/orders';

export default function AdminOrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <AdminOrderDetailScreen orderId={id!} />;
}
