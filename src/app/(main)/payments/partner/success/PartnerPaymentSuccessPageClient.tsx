"use client";

import { PaymentSuccessPage } from "@/components/payment/PaymentResultPages";

export default function PartnerPaymentSuccessPageClient() {
  return (
    <PaymentSuccessPage
      title="Payment submitted"
      description="Thank you! Your advertising plan will be activated once payment is confirmed."
      backHref="/become-partner"
      backLabel="Back to advertising"
    />
  );
}
