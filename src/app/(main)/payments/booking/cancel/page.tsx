import { PaymentCancelPage } from "@/components/payment/PaymentResultPages";

export default function BookingPaymentCancelPage() {
  return (
    <PaymentCancelPage
      title="Payment cancelled"
      backHref="/hosts"
      backLabel="Back to hosts"
    />
  );
}
