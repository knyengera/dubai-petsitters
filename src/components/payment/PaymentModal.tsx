"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, ExternalLink, Clock } from "lucide-react";
import { getEnabledPaymentProviders } from "@/lib/payments/providers";
import { startPaymentCheckout } from "@/lib/payments/client";
import { BANK_TRANSFER_INSTRUCTIONS } from "@/lib/payments/config";
import { CONTACT_PHONE, CONTACT_PHONE_TEL } from "@/lib/seo/site";
import type { EnabledPaymentProvider } from "@/lib/payments/types";

type PaymentModalProps = {
  open: boolean;
  onClose: () => void;
  summary?: {
    title?: string;
    lines?: { label: string; value: string }[];
    total?: string;
  };
  onConfirm: (provider: string) => Promise<{ paymentId: string }>;
  onComplete?: () => void;
  manualMessage?: string;
};

export default function PaymentModal({
  open,
  onClose,
  summary,
  onConfirm,
  onComplete,
  manualMessage,
}: PaymentModalProps) {
  const [providers, setProviders] = useState<EnabledPaymentProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<"redirect" | "manual" | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoadingProviders(true);
    getEnabledPaymentProviders()
      .then((list) => setProviders(list.filter((p) => p.provider_id !== "manual")))
      .finally(() => setLoadingProviders(false));
  }, [open]);

  const handlePay = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { paymentId } = await onConfirm(selected);
      const checkout = await startPaymentCheckout(paymentId, selected);

      if ("error" in checkout) {
        throw new Error(checkout.error);
      }

      if (checkout.mode === "redirect") {
        window.location.href = checkout.url;
        setDone("redirect");
        return;
      }

      setDone("manual");
      onComplete?.();
    } catch {
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const handleClose = () => {
    setSelected(null);
    setDone(null);
    onClose();
  };

  const selectedProvider = providers.find((p) => p.provider_id === selected);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Complete Payment</DialogTitle>
        </DialogHeader>

        {done === "redirect" ? (
          <div className="text-center py-6 space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="font-heading font-bold text-lg text-foreground">Redirecting to checkout…</p>
            <p className="text-sm text-muted-foreground">Please complete payment in the secure gateway window.</p>
          </div>
        ) : done === "manual" ? (
          <div className="text-center py-6 space-y-3">
            <Clock className="w-14 h-14 text-amber-500 mx-auto" />
            <p className="font-heading font-bold text-lg text-foreground">Awaiting confirmation</p>
            <p className="text-sm text-muted-foreground">
              {manualMessage ||
                (selected === "bank_transfer"
                  ? BANK_TRANSFER_INSTRUCTIONS
                  : "Your payment request has been submitted. An admin will confirm it shortly.")}
            </p>
            <Button onClick={handleClose} className="rounded-xl w-full mt-2">
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-foreground text-base">{summary?.title}</p>
              {summary?.lines?.map((line, i) => (
                <div key={i} className="flex justify-between text-muted-foreground">
                  <span>{line.label}</span>
                  <span className="font-medium text-foreground">{line.value}</span>
                </div>
              ))}
              <div className="border-t border-border pt-2 flex justify-between font-bold text-foreground">
                <span>Total Due Now</span>
                <span className="text-primary text-lg">{summary?.total}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Select Payment Method</p>
              {loadingProviders ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : providers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No payment methods are currently available. Please contact support at{" "}
                  <a href={`tel:${CONTACT_PHONE_TEL}`} className="text-primary hover:underline">
                    {CONTACT_PHONE}
                  </a>
                  .
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {providers.map((gw) => (
                    <button
                      key={gw.provider_id}
                      type="button"
                      onClick={() => setSelected(gw.provider_id)}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left ${
                        selected === gw.provider_id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-foreground">{gw.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {gw.integrationStatus === "live"
                            ? "Secure online checkout"
                            : gw.integrationStatus === "not_configured"
                              ? "Configured in admin — keys pending"
                              : "Manual confirmation required"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {gw.currencies}
                      </Badge>
                      {selected === gw.provider_id && (
                        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handlePay}
              disabled={!selected || loading || providers.length === 0}
              className="w-full rounded-xl h-11 font-bold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Pay Now{selectedProvider ? ` via ${selectedProvider.display_name}` : ""}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
