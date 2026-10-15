import { useLocalSearchParams } from 'expo-router';

import { CategoryProductsScreen } from '@/screens/category-products';

export default function CategoryProducts() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CategoryProductsScreen categoryId={id!} />;
}
