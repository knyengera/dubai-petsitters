import { PaymentCancelPage } from "@/components/payment/PaymentResultPages";

export default function PartnerPaymentCancelPage() {
  return (
    <PaymentCancelPage
      title="Payment cancelled"
      backHref="/become-partner"
      backLabel="Back to advertising"
    />
  );
}
