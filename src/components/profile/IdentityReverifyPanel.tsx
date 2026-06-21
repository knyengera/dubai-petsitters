"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  CheckCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { startIdentityVerification } from "@/lib/identity/actions";
import { useIdentityStatus } from "@/lib/identity/use-identity-status";

type Props = {
  userId: string;
  onVerified: () => void;
  onCancel: () => void;
};

/**
 * Re-verification variant of IdentityVerificationPanel. Because the host is
 * already "verified" when this opens, it force-starts a fresh Stripe session
 * (which resets the stored status to `pending`) and only treats a later
 * "verified" status as completion once it has observed the status leave
 * "verified" — preventing the stale verified value from instantly resolving.
 */
export default function IdentityReverifyPanel({
  userId,
  onVerified,
  onCancel,
}: Props) {
  const { toast } = useToast();
  const [verifyUrl, setVerifyUrl] = useState("");
  const [starting, setStarting] = useState(false);
  const startedRef = useRef(false);
  const sawNonVerifiedRef = useRef(false);
  const verifiedHandledRef = useRef(false);

  const { status, error, refresh } = useIdentityStatus(userId);

  const start = useCallback(async () => {
    setStarting(true);
    try {
      const result = await startIdentityVerification({ force: true });
      if (result.success === false) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }
      setVerifyUrl(result.verifyUrl);
      await refresh();
    } finally {
      setStarting(false);
    }
  }, [toast, refresh]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  useEffect(() => {
    if (status && status !== "verified") {
      sawNonVerifiedRef.current = true;
    }
    if (
      status === "verified" &&
      sawNonVerifiedRef.current &&
      !verifiedHandledRef.current
    ) {
      verifiedHandledRef.current = true;
      onVerified();
    }
  }, [status, onVerified]);

  const showVerified =
    status === "verified" && sawNonVerifiedRef.current;

  if (showVerified) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
        <p className="font-medium">Your identity is re-verified.</p>
        <p className="text-sm text-muted-foreground">Updating your details…</p>
      </div>
    );
  }

  const needsRetry = status === "requires_input" || status === "canceled";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
        <div className="mb-2 flex items-center justify-between gap-2 font-medium text-foreground">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Re-verify your identity
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
        Changing your verified ID details requires a fresh verification. Scan the
        QR code with your phone to photograph your passport or national ID and
        take a quick selfie. Keep this page open — it updates automatically once
        you&apos;re done.
      </div>

      {needsRetry ? (
        <div className="space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-center">
          <p className="text-sm font-medium text-foreground">
            Verification wasn&apos;t completed
          </p>
          <p className="text-sm text-muted-foreground">
            {error ?? "Please try again with a new code."}
          </p>
          <Button
            type="button"
            className="rounded-xl"
            onClick={start}
            disabled={starting}
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate a new code
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-2xl border border-border bg-white p-4">
            {starting || !verifyUrl ? (
              <div className="flex h-[200px] w-[200px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <QRCodeSVG value={verifyUrl} size={200} level="M" />
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            {status === "processing" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Reviewing your documents…
              </span>
            ) : (
              "Waiting for you to finish on your phone…"
            )}
          </div>

          <button
            type="button"
            className="text-xs text-primary hover:underline disabled:opacity-50"
            onClick={start}
            disabled={starting}
          >
            Refresh QR code
          </button>
        </div>
      )}
    </div>
  );
}
