import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function OrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title={`Order ${id ?? ''}`}
      description="Items, totals, payment status, and status timeline."
      phase="Arrives in Phase 4-5"
    />
  );
}
