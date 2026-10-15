import { ScreenPlaceholder } from '@/components/screen-placeholder';

export default function PaymentResult() {
  return (
    <ScreenPlaceholder
      title="Payment Result"
      description="Shown only after backend verification confirms the payment status."
      phase="Arrives in Phase 4"
    />
  );
}
