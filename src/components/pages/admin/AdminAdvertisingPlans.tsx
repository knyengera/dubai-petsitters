"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  AdminRecordEditDialog,
  AdminRecordViewDialog,
  type AdminRecordField,
} from "@/components/admin/AdminRecordDialogs";
import { useAdminPaginatedList } from "@/components/admin/useAdminPaginatedList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { formatAdvertisingPlanPrice } from "@/lib/partners/advertising-plans";
import {
  adminGetPartnerBillingSettings,
  adminUpdatePartnerBillingSettings,
} from "@/lib/partners/subscription-actions";

const EMPTY = {
  name: "",
  amount: "",
  currency: "USD",
  period_label: "/month",
  features: "",
  badge: "",
  highlight: "default",
  sort_order: "0",
  is_active: true,
};

const FIELDS: AdminRecordField[] = [
  { key: "name", label: "Plan Name", required: true },
  { key: "amount", label: "Price", type: "number", required: true },
  { key: "currency", label: "Currency", required: true },
  { key: "period_label", label: "Period Label", placeholder: "/month" },
  { key: "badge", label: "Badge", placeholder: "e.g. Most Popular" },
  {
    key: "highlight",
    label: "Card Style",
    type: "select",
    options: ["default", "featured", "premium"],
  },
  { key: "sort_order", label: "Sort Order", type: "integer" },
  { key: "is_active", label: "Active", type: "checkbox" },
  {
    key: "features",
    label: "Features",
    type: "list",
    className: "col-span-2",
    placeholder: "Directory listing, Business profile page, Contact button",
  },
];

function featuresToInput(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  return value === null || value === undefined ? "" : String(value);
}

export default function AdminAdvertisingPlans() {
  const {
    rows: plans,
    total,
    page,
    pageSize,
    setPage,
    search,
    setSearch,
    isLoading,
    updateRow,
    deleteRow,
    createRow,
  } = useAdminPaginatedList(ADMIN_TABLES.advertising_plans, "admin-advertising-plans");
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<Row | null>(null);
  const [editingPlan, setEditingPlan] = useState<Row | null>(null);
  const [billingEnabled, setBillingEnabled] = useState<boolean | null>(null);
  const [billingSaving, setBillingSaving] = useState(false);

  useEffect(() => {
    adminGetPartnerBillingSettings().then((result) => {
      if (result.ok) setBillingEnabled(result.data.billing_enabled);
    });
  }, []);

  const handleBillingToggle = async (enabled: boolean) => {
    setBillingSaving(true);
    const result = await adminUpdatePartnerBillingSettings({ billingEnabled: enabled });
    setBillingSaving(false);

    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }

    setBillingEnabled(result.data.billing_enabled);
    toast({
      title: enabled ? "Advertising billing enabled" : "Advertising billing disabled",
      description: enabled
        ? "Partners must select a plan and pay to be listed."
        : "Partners can onboard for free — plans are hidden and no payment is taken.",
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const features = form.features
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const created = await createRow(
      {
        name: form.name.trim(),
        amount: Number(form.amount),
        currency: form.currency.trim() || "USD",
        period_label: form.period_label.trim() || "/month",
        features,
        badge: form.badge.trim() || null,
        highlight: form.highlight,
        sort_order: Number(form.sort_order || 0),
        is_active: form.is_active,
        updated_at: new Date().toISOString(),
      },
      "Advertising plan created"
    );
    if (created) {
      setForm(EMPTY);
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(
      id,
      { ...payload, updated_at: new Date().toISOString() },
      "Advertising plan updated"
    );

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Advertising Plans"
        description="Manage partner advertising pricing tiers shown on the Partners page."
        actions={
          <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Plan
          </Button>
        }
      />

      <div className="mb-6 rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary shrink-0" />
              <p className="font-semibold text-foreground">Advertising billing</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              When enabled, partners must pick a plan and pay via Stripe to be listed. When
              disabled, the Partners page hides plans and partners can join for free (no
              payment).
            </p>
          </div>
          <Switch
            checked={billingEnabled ?? true}
            disabled={billingEnabled === null || billingSaving}
            onCheckedChange={handleBillingToggle}
            aria-label="Toggle advertising billing"
          />
        </div>
      </div>

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by plan name..."
        total={total}
        page={page}
        pageSize={pageSize}
        resultNoun="plans"
      />

      <AdminDataList
        rows={plans}
        isLoading={isLoading}
        columns={[
          { key: "name", label: "Plan" },
          {
            key: "amount",
            label: "Price",
            render: (row) => formatAdvertisingPlanPrice({
              amount: Number(row.amount ?? 0),
              currency: String(row.currency ?? "USD"),
            }),
          },
          { key: "period_label", label: "Period" },
          {
            key: "highlight",
            label: "Style",
            render: (row) => (
              <Badge variant="secondary" className="capitalize text-[10px]">
                {String(row.highlight ?? "default")}
              </Badge>
            ),
          },
          {
            key: "is_active",
            label: "Active",
            render: (row) => (row.is_active ? "Yes" : "No"),
          },
        ]}
        onView={setViewingPlan}
        onEdit={setEditingPlan}
        onDelete={(row) => deleteRow(String(row.id), `Delete plan "${row.name}"?`)}
      />

      <AdminPagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Advertising Plan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="mb-1.5 block">Plan Name *</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Price *</Label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Currency</Label>
                <Input
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Period Label</Label>
                <Input
                  value={form.period_label}
                  onChange={(e) => setForm((f) => ({ ...f, period_label: e.target.value }))}
                  className="rounded-xl"
                  placeholder="/month"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Card Style</Label>
                <Select
                  value={form.highlight}
                  onValueChange={(v) => setForm((f) => ({ ...f, highlight: v }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="featured">Featured (primary border)</SelectItem>
                    <SelectItem value="premium">Premium (accent border)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Badge</Label>
                <Input
                  value={form.badge}
                  onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
                  className="rounded-xl"
                  placeholder="e.g. Most Popular"
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Features (comma-separated)</Label>
                <Input
                  value={form.features}
                  onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                  className="rounded-xl"
                  placeholder="Directory listing, Featured placement"
                />
              </div>
              <div className="col-span-2 flex items-center gap-2 rounded-xl border border-border p-3">
                <input
                  type="checkbox"
                  id="plan-active"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                />
                <Label htmlFor="plan-active">Active (visible on Partners page)</Label>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Plan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AdminRecordViewDialog
        row={viewingPlan}
        title="Advertising Plan"
        titleKey="name"
        fields={FIELDS}
        badges={(row) => (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {row.is_active ? "Active" : "Inactive"}
          </Badge>
        )}
        onOpenChange={(open) => !open && setViewingPlan(null)}
      />
      <AdminRecordEditDialog
        row={
          editingPlan
            ? {
                ...editingPlan,
                features: featuresToInput(editingPlan.features),
              }
            : null
        }
        title="Edit Advertising Plan"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingPlan(null)}
      />
    </div>
  );
}
