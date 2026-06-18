import { PaymentCancelPage } from "@/components/payment/PaymentResultPages";

export default function VetPaymentCancelPage() {
  return (
    <PaymentCancelPage
      title="Payment cancelled"
      backHref="/become-partner?type=vet-clinics"
      backLabel="Back to vet advertising"
    />
  );
}
