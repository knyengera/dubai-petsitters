import { PaymentCancelPage } from "@/components/payment/PaymentResultPages";

export default function VetPaymentCancelPage() {
  return (
    <PaymentCancelPage
      title="Payment cancelled"
      backHref="/vet-advertise"
      backLabel="Back to vet advertising"
    />
  );
}
