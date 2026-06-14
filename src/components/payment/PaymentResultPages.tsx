"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Clock } from "lucide-react";
import { pollPaymentStatus } from "@/lib/payments/client";

type PaymentSuccessPageProps = {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
};

export function PaymentSuccessPage({
  title,
  description,
  backHref,
  backLabel,
}: PaymentSuccessPageProps) {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const [status, setStatus] = useState<"loading" | "captured" | "pending">("loading");

  useEffect(() => {
    if (!paymentId) {
      setStatus("pending");
      return;
    }
    pollPaymentStatus(paymentId).then((result) => {
      setStatus(result.captured ? "captured" : "pending");
    });
  }, [paymentId]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Confirming your payment…</p>
          </>
        )}
        {status === "captured" && (
          <>
            <CheckCircle className="w-14 h-14 text-primary mx-auto" />
            <h1 className="font-heading text-2xl font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </>
        )}
        {status === "pending" && (
          <>
            <Clock className="w-14 h-14 text-amber-500 mx-auto" />
            <h1 className="font-heading text-2xl font-bold">Payment processing</h1>
            <p className="text-sm text-muted-foreground">
              Your payment is being confirmed. You will receive a notification once it is complete.
            </p>
          </>
        )}
        <Link
          href={backHref}
          className="inline-flex items-center justify-center rounded-xl w-full h-10 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

export function PaymentCancelPage({
  title,
  backHref,
  backLabel,
}: {
  title: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="font-heading text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">No charges were made. You can try again when ready.</p>
        <Link
          href={backHref}
          className="inline-flex items-center justify-center rounded-xl w-full h-10 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
