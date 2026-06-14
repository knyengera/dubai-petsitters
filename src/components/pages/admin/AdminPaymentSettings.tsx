"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminListPaymentProviders, adminUpdatePaymentProvider } from "@/lib/monetisation/actions";
import type { PaymentProviderSettings } from "@/lib/monetisation/types";
import {
  isPayPalConfigured,
  isPayPalWebhookConfigured,
  isStripeConfigured,
  isStripeWebhookConfigured,
} from "@/lib/payments/config";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

function statusBadge(provider: PaymentProviderSettings) {
  if (provider.integration_mode === "manual") {
    return <Badge variant="secondary">Manual</Badge>;
  }
  if (provider.provider_id === "stripe") {
    if (!isStripeConfigured()) return <Badge variant="destructive">Not configured</Badge>;
    if (!isStripeWebhookConfigured()) return <Badge variant="outline">Keys set — webhook missing</Badge>;
    return <Badge className="bg-green-600">Live</Badge>;
  }
  if (provider.provider_id === "paypal") {
    if (!isPayPalConfigured()) return <Badge variant="destructive">Not configured</Badge>;
    if (!isPayPalWebhookConfigured()) return <Badge variant="outline">Keys set — webhook missing</Badge>;
    return <Badge className="bg-green-600">Live</Badge>;
  }
  return <Badge variant="secondary">Manual</Badge>;
}

export default function AdminPaymentSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [providers, setProviders] = useState<PaymentProviderSettings[]>([]);

  useEffect(() => {
    adminListPaymentProviders().then((result) => {
      if (result.ok) setProviders(result.data);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (providerId: string, isEnabled: boolean) => {
    setSaving(providerId);
    const result = await adminUpdatePaymentProvider({ providerId, isEnabled });
    setSaving(null);
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    setProviders((prev) =>
      prev.map((p) => (p.provider_id === providerId ? { ...p, is_enabled: isEnabled } : p))
    );
    toast({ title: isEnabled ? "Provider enabled" : "Provider disabled" });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const allDisabled = providers.every((p) => !p.is_enabled);

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Payment Settings"
        description="Enable or disable payment methods shown to customers."
      />

      {allDisabled && (
        <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          All payment providers are disabled. Customers will not be able to pay.
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        {providers.map((provider) => (
          <div
            key={provider.provider_id}
            className="flex items-center justify-between gap-4 p-4 sm:p-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{provider.display_name}</p>
                {statusBadge(provider)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {provider.currencies} · {provider.integration_mode === "live" ? "Gateway checkout" : "Admin confirmation required"}
              </p>
            </div>
            <Switch
              checked={provider.is_enabled}
              disabled={saving === provider.provider_id}
              onCheckedChange={(checked) => handleToggle(provider.provider_id, checked)}
            />
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Stripe and PayPal credentials are read from environment variables. Webhook secrets (
        <code className="text-[11px]">STRIPE_WEBHOOK_SECRET</code>,{" "}
        <code className="text-[11px]">PAYPAL_WEBHOOK_ID</code>) must be set for live capture.
      </p>
    </div>
  );
}
