import { useLocalSearchParams } from 'expo-router';

import { EditProductScreen } from '@/screens/admin/products';

export default function AdminEditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditProductScreen productId={id!} />;
}
