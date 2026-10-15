import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title={`Product ${id ?? ''}`}
      description="Image gallery, description, weight selector, and add-to-cart."
      phase="Arrives in Phase 3"
    />
  );
}
