"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { SUPPORTED_PAYMENT_PROVIDERS } from "@/lib/monetisation/constants";

const GATEWAY_URLS: Record<string, string> = {
  paypal: "https://www.paypal.com/checkoutnow",
  payfast: "https://www.payfast.co.za/eng/process",
  salla: "https://checkout.salla.sa/",
  stripe: "https://checkout.stripe.com/",
  hyperpay: "https://hyperpay.com/",
  moyasar: "https://moyasar.com/",
  tap: "https://tap.company/",
  bank_transfer: "#",
  manual: "#",
};

export default function PaymentModal({ open, onClose, summary, onConfirm }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handlePay = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await onConfirm(selected);
      setLoading(false);
      setDone(true);
      const url = GATEWAY_URLS[selected];
      if (url && url !== "#") {
        window.open(url, "_blank");
      }
    } catch {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelected(null);
    setDone(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Complete Payment</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-14 h-14 text-primary mx-auto" />
            <p className="font-heading font-bold text-lg text-foreground">Payment secured!</p>
            <p className="text-sm text-muted-foreground">
              Your payment is held in escrow until the hosting service is completed.
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
              <p className="text-[11px] text-muted-foreground pt-1">
                Amounts are calculated server-side. Funds release to the host after service completion.
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground mb-3">Select Payment Method</p>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {SUPPORTED_PAYMENT_PROVIDERS.filter((p) => p.id !== "manual").map((gw) => (
                  <button
                    key={gw.id}
                    type="button"
                    onClick={() => setSelected(gw.id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left ${
                      selected === gw.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/40"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{gw.name}</p>
                      <p className="text-xs text-muted-foreground">Provider integration coming soon</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {gw.currencies}
                    </Badge>
                    {selected === gw.id && <CheckCircle className="w-5 h-5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handlePay}
              disabled={!selected || loading}
              className="w-full rounded-xl h-11 font-bold"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              Pay Now via {selected ? SUPPORTED_PAYMENT_PROVIDERS.find((g) => g.id === selected)?.name : "..."}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Placeholder checkout — real provider webhooks will confirm payment in a later phase.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
