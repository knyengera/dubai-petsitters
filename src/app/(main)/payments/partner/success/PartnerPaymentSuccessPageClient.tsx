"use client";

import Link from "next/link";
import { CheckCircle } from "lucide-react";
import ManageBillingButton from "@/components/partners/ManageBillingButton";

export default function PartnerPaymentSuccessPageClient() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <CheckCircle className="w-14 h-14 text-primary mx-auto" />
        <h1 className="font-heading text-2xl font-bold">Subscription active</h1>
        <p className="text-sm text-muted-foreground">
          Thank you! Your advertising plan is now billed monthly. You can update
          your payment method or cancel anytime from the billing portal.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <ManageBillingButton label="Manage subscription" />
          <Link
            href="/become-partner"
            className="inline-flex items-center justify-center rounded-xl w-full h-10 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Back to advertising
          </Link>
        </div>
      </div>
    </div>
  );
}
