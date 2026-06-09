"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminListFeeSettings, adminUpsertFeeSettings } from "@/lib/monetisation/actions";
import type { PlatformFeeSettings } from "@/lib/monetisation/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AdminFeeSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformFeeSettings[]>([]);
  const [form, setForm] = useState({
    guest_service_fee_pct: "10",
    host_payout_fee_pct: "2",
    guest_fee_min: "0",
    guest_fee_max: "",
    host_payout_fee_min: "0",
    host_payout_fee_max: "",
    currency: "SAR",
  });

  useEffect(() => {
    adminListFeeSettings().then((result) => {
      if (result.ok) {
        setSettings(result.data);
        const active = result.data.find((s) => s.is_active);
        if (active) {
          setForm({
            guest_service_fee_pct: String(active.guest_service_fee_pct),
            host_payout_fee_pct: String(active.host_payout_fee_pct),
            guest_fee_min: String(active.guest_fee_min ?? 0),
            guest_fee_max: active.guest_fee_max != null ? String(active.guest_fee_max) : "",
            host_payout_fee_min: String(active.host_payout_fee_min ?? 0),
            host_payout_fee_max: active.host_payout_fee_max != null ? String(active.host_payout_fee_max) : "",
            currency: active.currency || "SAR",
          });
        }
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await adminUpsertFeeSettings({
      name: "default",
      guest_service_fee_pct: parseFloat(form.guest_service_fee_pct),
      host_payout_fee_pct: parseFloat(form.host_payout_fee_pct),
      guest_fee_min: parseFloat(form.guest_fee_min || "0"),
      guest_fee_max: form.guest_fee_max ? parseFloat(form.guest_fee_max) : null,
      host_payout_fee_min: parseFloat(form.host_payout_fee_min || "0"),
      host_payout_fee_max: form.host_payout_fee_max ? parseFloat(form.host_payout_fee_max) : null,
      currency: form.currency,
      is_active: true,
    });
    setSaving(false);
    if (result.ok === false) {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Fee settings updated" });
    setSettings((prev) => [result.data, ...prev.filter((s) => s.id !== result.data.id)]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Platform Fees"
        description="Dynamic guest service fee and host payout fee. Amounts are enforced server-side on every booking."
      />

      <form onSubmit={handleSave} className="max-w-xl bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Guest service fee (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.guest_service_fee_pct}
              onChange={(e) => setForm((f) => ({ ...f, guest_service_fee_pct: e.target.value }))}
              className="rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Added on top of host price (e.g. 10% → SAR 100 becomes SAR 110)</p>
          </div>
          <div>
            <Label className="mb-1.5 block">Host payout fee (%)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.host_payout_fee_pct}
              onChange={(e) => setForm((f) => ({ ...f, host_payout_fee_pct: e.target.value }))}
              className="rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Deducted when host withdraws (e.g. 2% on SAR 100 → SAR 98 net)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="mb-1.5 block">Guest fee min (SAR)</Label>
            <Input type="number" min="0" step="0.01" value={form.guest_fee_min} onChange={(e) => setForm((f) => ({ ...f, guest_fee_min: e.target.value }))} className="rounded-xl" />
          </div>
          <div>
            <Label className="mb-1.5 block">Guest fee max (optional)</Label>
            <Input type="number" min="0" step="0.01" value={form.guest_fee_max} onChange={(e) => setForm((f) => ({ ...f, guest_fee_max: e.target.value }))} className="rounded-xl" />
          </div>
        </div>

        <Button type="submit" disabled={saving} className="rounded-xl">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save active fee settings
        </Button>
      </form>

      {settings.length > 0 && (
        <div className="mt-8">
          <h3 className="font-semibold mb-3">History</h3>
          <div className="space-y-2 text-sm">
            {settings.slice(0, 5).map((s) => (
              <div key={s.id} className="flex justify-between border border-border rounded-xl p-3">
                <span>
                  Guest {s.guest_service_fee_pct}% · Payout {s.host_payout_fee_pct}%
                  {s.is_active ? " · active" : ""}
                </span>
                <span className="text-muted-foreground">{new Date(s.effective_from).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
