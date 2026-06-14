"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, CreditCard, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { saveHostPayoutSettings } from "@/lib/hosting/payout-settings";
import type {
  HostPayoutMethod,
  HostPayoutSettings,
  HostPayoutSettingsInput,
} from "@/lib/hosting/payout-settings-types";

function emptyForm(method: HostPayoutMethod = "bank_transfer"): HostPayoutSettingsInput {
  return {
    payout_method: method,
    bank_account_holder_name: "",
    bank_name: "",
    bank_account_number: "",
    bank_iban_or_routing: "",
    bank_swift_bic: "",
    paypal_email: "",
  };
}

function settingsToForm(settings: HostPayoutSettings): HostPayoutSettingsInput {
  return {
    payout_method: settings.payout_method,
    bank_account_holder_name: settings.bank_account_holder_name ?? "",
    bank_name: settings.bank_name ?? "",
    bank_account_number: settings.bank_account_number ?? "",
    bank_iban_or_routing: settings.bank_iban_or_routing ?? "",
    bank_swift_bic: settings.bank_swift_bic ?? "",
    paypal_email: settings.paypal_email ?? "",
  };
}

export default function HostPayoutMethodForm({
  hostId,
  settings,
  embedded = false,
  onSaved,
}: {
  hostId: string;
  settings: HostPayoutSettings | null;
  embedded?: boolean;
  onSaved?: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<HostPayoutSettingsInput>(emptyForm());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm(settingsToForm(settings));
    } else {
      setForm(emptyForm());
    }
  }, [settings]);

  const setMethod = (method: HostPayoutMethod) => {
    setForm((prev) => ({ ...prev, payout_method: method }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await saveHostPayoutSettings(hostId, form);
    setLoading(false);
    if (result.ok === false) {
      toast({ title: "Could not save payout method", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Payout method saved" });
    onSaved?.();
  };

  const content = (
    <>
      {!embedded && (
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Payout method</h3>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Choose how you want to receive withdrawals. You must save a payout method before requesting a withdrawal.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMethod("bank_transfer")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
              form.payout_method === "bank_transfer"
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-1" />
            Direct bank deposit
          </button>
          <button
            type="button"
            onClick={() => setMethod("paypal")}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-medium border transition-all ${
              form.payout_method === "paypal"
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            PayPal
          </button>
        </div>

        {form.payout_method === "bank_transfer" ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Account holder name *</Label>
              <Input
                required
                value={form.bank_account_holder_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bank_account_holder_name: e.target.value }))
                }
                className="rounded-xl mt-1"
                placeholder="Name on the bank account"
              />
            </div>
            <div>
              <Label className="text-xs">Bank name *</Label>
              <Input
                required
                value={form.bank_name}
                onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                className="rounded-xl mt-1"
                placeholder="e.g. Al Rajhi Bank"
              />
            </div>
            <div>
              <Label className="text-xs">Account number *</Label>
              <Input
                required
                value={form.bank_account_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bank_account_number: e.target.value }))
                }
                className="rounded-xl mt-1"
                placeholder="Your account number"
              />
            </div>
            <div>
              <Label className="text-xs">IBAN or routing number *</Label>
              <Input
                required
                value={form.bank_iban_or_routing}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bank_iban_or_routing: e.target.value }))
                }
                className="rounded-xl mt-1"
                placeholder="IBAN or routing number"
              />
            </div>
            <div>
              <Label className="text-xs">SWIFT / BIC (optional)</Label>
              <Input
                value={form.bank_swift_bic}
                onChange={(e) => setForm((f) => ({ ...f, bank_swift_bic: e.target.value }))}
                className="rounded-xl mt-1"
                placeholder="For international transfers"
              />
            </div>
          </div>
        ) : (
          <div>
            <Label className="text-xs">PayPal email *</Label>
            <Input
              required
              type="email"
              value={form.paypal_email}
              onChange={(e) => setForm((f) => ({ ...f, paypal_email: e.target.value }))}
              className="rounded-xl mt-1"
              placeholder="you@example.com"
            />
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full rounded-xl">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save payout method
        </Button>
      </form>
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <div id="payout-method" className="bg-card border border-border rounded-2xl p-5 space-y-4">
      {content}
    </div>
  );
}
