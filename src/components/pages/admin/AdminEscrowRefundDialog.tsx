"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import { estimateHostClawback } from "@/lib/monetisation/refund-utils";
import { refundEscrowPayment } from "@/lib/monetisation/actions";
import type { Row } from "@/lib/admin/tables";

type AdminEscrowRefundDialogProps = {
  row: Row | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export default function AdminEscrowRefundDialog({
  row,
  onOpenChange,
  onSuccess,
}: AdminEscrowRefundDialogProps) {
  const [mode, setMode] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currency = String(row?.currency ?? DEFAULT_CURRENCY);
  const grossAmount = Number(row?.gross_amount ?? 0);
  const refundedAmount = Number(row?.refunded_amount ?? 0);
  const refundableAmount = Number(row?.refundable_amount ?? Math.max(0, grossAmount - refundedAmount));
  const hostEarnings = Number(row?.host_earnings ?? 0);
  const escrowStatus = String(row?.status ?? "");
  const paymentMethod = String(row?.payment_method_label ?? row?.payment_provider ?? "Unknown");
  const payerEmail = String(row?.payer_email ?? "—");

  useEffect(() => {
    if (!row) return;
    setMode("full");
    setAmount(String(refundableAmount));
    setReason("");
    setError(null);
  }, [row, refundableAmount]);

  const parsedAmount = mode === "full" ? refundableAmount : parseFloat(amount);
  const hostClawback = estimateHostClawback(
    Number.isFinite(parsedAmount) ? parsedAmount : 0,
    grossAmount,
    hostEarnings,
    escrowStatus
  );

  const handleSubmit = async () => {
    if (!row?.booking_id) return;
    setSubmitting(true);
    setError(null);

    const refundAmount = mode === "full" ? undefined : parsedAmount;
    if (mode === "partial" && (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) {
      setError("Enter a valid refund amount");
      setSubmitting(false);
      return;
    }
    if (mode === "partial" && parsedAmount > refundableAmount + 0.001) {
      setError(`Amount cannot exceed ${currency} ${refundableAmount.toFixed(2)}`);
      setSubmitting(false);
      return;
    }

    const result = await refundEscrowPayment({
      bookingId: String(row.booking_id),
      amount: refundAmount,
      reason: reason.trim() || undefined,
    });

    setSubmitting(false);
    if (result.ok === false) {
      setError(result.error);
      return;
    }

    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={Boolean(row)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(520px,calc(100vw-2rem))] rounded-2xl">
        {row ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading">Refund escrow payment</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 text-sm">
              <div className="grid gap-3 rounded-xl bg-muted/50 p-4">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Payment method</span>
                  <span className="font-medium capitalize">{paymentMethod}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Payer</span>
                  <span className="font-medium">{payerEmail}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Gross</span>
                  <span className="font-medium">
                    {currency} {grossAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Already refunded</span>
                  <span className="font-medium">
                    {currency} {refundedAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-semibold text-primary">
                    {currency} {refundableAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "full" ? "default" : "outline"}
                  className="rounded-lg"
                  onClick={() => setMode("full")}
                >
                  Full refund
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={mode === "partial" ? "default" : "outline"}
                  className="rounded-lg"
                  onClick={() => setMode("partial")}
                >
                  Partial refund
                </Button>
              </div>

              {mode === "partial" && (
                <div className="space-y-2">
                  <Label htmlFor="refund-amount">Refund amount</Label>
                  <Input
                    id="refund-amount"
                    type="number"
                    min={0.01}
                    max={refundableAmount}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="rounded-lg"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="refund-reason">Reason (optional)</Label>
                <Textarea
                  id="refund-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Guest cancellation, service issue"
                  className="rounded-lg min-h-[80px]"
                />
              </div>

              {escrowStatus === "released" && hostClawback > 0 && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                  Host balance will be debited by approximately {currency} {hostClawback.toFixed(2)}.
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Funds will be returned to the guest via the original payment method ({paymentMethod}).
              </p>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-lg"
                  onClick={handleSubmit}
                  disabled={submitting || refundableAmount <= 0}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm refund"}
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
