import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function AdminOrders() {
  return (
    <ScreenPlaceholder
      title="Order Management"
      description="New, Paid Awaiting Acceptance, Accepted, Preparing, Dispatch, Delivered, Rejected/Cancelled."
      phase="Arrives in Phase 5"
    />
  );
}
