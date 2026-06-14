"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { requestHostPayout } from "@/lib/monetisation/actions";
import { estimatePayoutNet } from "@/lib/monetisation/pricing";
import { formatMoney, DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import type { HostBalance } from "@/lib/monetisation/types";
import type { HostPayoutSettings } from "@/lib/hosting/payout-settings-types";

export default function HostEarningsPanel({
  hostId,
  balance,
  payoutSettings,
  payoutFeePct = 2,
  onUpdated,
}: {
  hostId: string;
  balance: HostBalance | null;
  payoutSettings?: HostPayoutSettings | null;
  payoutFeePct?: number;
  onUpdated?: () => void;
}) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const available = balance?.available_balance ?? 0;
  const preview = amount ? estimatePayoutNet(parseFloat(amount) || 0, payoutFeePct) : null;
  const hasPayoutMethod = !!payoutSettings?.payout_method;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPayoutMethod || !payoutSettings) {
      toast({
        title: "Payout method required",
        description: "Save a payout method before requesting a withdrawal.",
        variant: "destructive",
      });
      return;
    }
    const gross = parseFloat(amount);
    if (!Number.isFinite(gross) || gross <= 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setLoading(true);
    const result = await requestHostPayout({
      hostId,
      grossAmount: gross,
      paymentProvider: payoutSettings.payout_method,
      idempotencyKey: crypto.randomUUID(),
    });
    setLoading(false);
    if (result.ok === false) {
      toast({ title: "Withdrawal failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({
      title: "Withdrawal requested",
      description: `Net payout: ${formatMoney(result.data.payout.net_amount)} after ${result.data.payout.payout_fee_pct}% fee`,
    });
    setAmount("");
    onUpdated?.();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Earnings</h3>
        <Badge variant="secondary" className="text-[10px] ml-auto">
          Escrow-protected
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-primary/5 rounded-xl p-3">
          <p className="text-muted-foreground text-xs">Available</p>
          <p className="font-bold text-lg">{formatMoney(available)}</p>
        </div>
        <div className="bg-muted rounded-xl p-3">
          <p className="text-muted-foreground text-xs">Lifetime earned</p>
          <p className="font-bold text-lg">{formatMoney(balance?.lifetime_earned ?? 0)}</p>
        </div>
      </div>

      {!hasPayoutMethod && (
        <p className="text-sm text-muted-foreground bg-secondary rounded-xl p-3">
          Add a payout method above before you can request a withdrawal.{" "}
          <Link href="#payout-method" className="text-primary font-medium hover:underline">
            Set up payout method
          </Link>
        </p>
      )}

      <form onSubmit={handleWithdraw} className="space-y-3">
        <div>
          <Label className="text-xs">Withdraw amount ({DEFAULT_CURRENCY})</Label>
          <Input
            type="number"
            min="0"
            step="0.01"
            max={available}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Max ${available.toFixed(2)}`}
            className="rounded-xl mt-1"
            disabled={!hasPayoutMethod}
          />
        </div>
        {preview && preview.gross > 0 && (
          <div className="text-xs text-muted-foreground space-y-1 bg-secondary rounded-xl p-3">
            <div className="flex justify-between">
              <span>Payout fee ({payoutFeePct}%)</span>
              <span>{formatMoney(preview.fee)}</span>
            </div>
            <div className="flex justify-between font-semibold text-foreground">
              <span>You receive</span>
              <span>{formatMoney(preview.net)}</span>
            </div>
          </div>
        )}
        <Button
          type="submit"
          disabled={loading || available <= 0 || !amount || !hasPayoutMethod}
          className="w-full rounded-xl"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Request withdrawal
        </Button>
      </form>
    </div>
  );
}
