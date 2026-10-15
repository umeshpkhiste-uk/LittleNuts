import { useLocalSearchParams } from 'expo-router';

import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function AdminOrderDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title={`Order ${id ?? ''}`}
      description="Accept/reject, stock validation, status updates, audit trail."
      phase="Arrives in Phase 5-6"
    />
  );
}
