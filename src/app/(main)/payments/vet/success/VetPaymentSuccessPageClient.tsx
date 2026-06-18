"use client";

import { PaymentSuccessPage } from "@/components/payment/PaymentResultPages";

export default function VetPaymentSuccessPageClient() {
  return (
    <PaymentSuccessPage
      title="Subscription payment confirmed"
      description="Your vet clinic subscription will be activated shortly."
      backHref="/become-partner?type=vet-clinics"
      backLabel="Back to vet advertising"
    />
  );
}
