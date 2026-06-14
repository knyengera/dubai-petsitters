import { PaymentCancelPage } from "@/components/payment/PaymentResultPages";

export default function PartnerPaymentCancelPage() {
  return (
    <PaymentCancelPage
      title="Payment cancelled"
      backHref="/partners"
      backLabel="Back to partners"
    />
  );
}
