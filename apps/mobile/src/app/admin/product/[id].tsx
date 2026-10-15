import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function AdminEditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title={`Edit Product ${id ?? ''}`}
      description="Price, images, min/max weight, increments, reorder threshold."
      phase="Arrives in Phase 3"
    />
  );
}
