"use client";

import { PaymentSuccessPage } from "@/components/payment/PaymentResultPages";

export default function BookingPaymentSuccessPageClient() {
  return (
    <PaymentSuccessPage
      title="Booking payment confirmed"
      description="Your booking is confirmed and payment is held in escrow until the service is completed."
      backHref="/hosts"
      backLabel="Back to hosts"
    />
  );
}
