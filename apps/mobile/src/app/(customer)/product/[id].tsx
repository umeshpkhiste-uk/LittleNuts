import { useLocalSearchParams } from 'expo-router';

import { ProductDetailsScreen } from '@/screens/product-details';

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProductDetailsScreen productId={id!} />;
}
