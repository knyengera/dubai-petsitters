"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import GalleryImageUpload from "@/components/common/GalleryImageUpload";
import {
  AdminRecordEditDialog,
  AdminRecordViewDialog,
  type AdminRecordField,
} from "@/components/admin/AdminRecordDialogs";
import { useAdminPaginatedList } from "@/components/admin/useAdminPaginatedList";
import { getAdminListConfig } from "@/lib/admin/list-config";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";

const LIST_CONFIG = getAdminListConfig(ADMIN_TABLES.partner_deals);

const PARTNER_TYPE_OPTIONS = ["vet_clinic", "pet_shop", "grooming", "insurance", "food", "other"];

const EMPTY = {
  title: "",
  description: "",
  partner_name: "",
  partner_type: "other",
  discount: "",
  discount_label: "",
  discount_code: "",
  city: "",
  image_url: "",
  gallery: [] as string[],
  link_url: "",
  is_active: true,
};
const FIELDS: AdminRecordField[] = [
  { key: "title", label: "Title", required: true },
  { key: "description", label: "Description", type: "textarea", className: "col-span-2" },
  { key: "partner_name", label: "Partner" },
  { key: "partner_type", label: "Partner Type", type: "select", options: PARTNER_TYPE_OPTIONS },
  { key: "discount", label: "Discount" },
  { key: "discount_label", label: "Discount Label", placeholder: "e.g. 20% OFF" },
  { key: "discount_code", label: "Promo Code", placeholder: "e.g. PETSITTER20" },
  { key: "city", label: "City" },
  { key: "gallery", label: "Images", type: "gallery", coverKey: "image_url", galleryKey: "gallery", hideInView: true, uploadCategory: "partners" },
  { key: "link_url", label: "Link URL" },
  { key: "is_active", label: "Active", type: "checkbox" },
];

export default function AdminPartnerDeals() {
  const {
    rows: deals,
    total,
    page,
    pageSize,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    isLoading,
    updateRow,
    deleteRow,
    createRow,
  } = useAdminPaginatedList(ADMIN_TABLES.partner_deals, "admin-partner-deals");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [viewingDeal, setViewingDeal] = useState<Row | null>(null);
  const [editingDeal, setEditingDeal] = useState<Row | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const created = await createRow(form, "Deal created");
    if (created) {
      setForm(EMPTY);
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Deal updated");

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Partner Deals"
        description="Manage partner promotions and deals."
        actions={
          <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Deal
          </Button>
        }
      />
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title or partner..."
        filters={(LIST_CONFIG.filters ?? []).map((f) => ({
          key: f.key,
          value: filters[f.key] ?? "all",
          options: f.options,
          allLabel: "All",
        }))}
        onFilterChange={setFilter}
        total={total}
        page={page}
        pageSize={pageSize}
        resultNoun="deals"
      />
      <AdminDataList
        rows={deals}
        isLoading={isLoading}
        columns={[
          { key: "title", label: "Title" },
          { key: "partner_name", label: "Partner" },
          { key: "discount", label: "Discount" },
          { key: "discount_code", label: "Promo Code" },
          { key: "is_active", label: "Active" },
        ]}
        onView={setViewingDeal}
        onEdit={setEditingDeal}
        rowActions={(row) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() =>
              updateRow(String(row.id), { is_active: !row.is_active })
            }
          >
            {row.is_active ? "Deactivate" : "Activate"}
          </Button>
        )}
        onDelete={(row) => deleteRow(String(row.id), `Delete "${row.title}"?`)}
      />

      <AdminPagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Partner Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div><Label>Partner</Label><Input value={form.partner_name} onChange={(e) => setForm((f) => ({ ...f, partner_name: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div>
              <Label className="mb-1 block">Partner Type</Label>
              <Select value={form.partner_type} onValueChange={(v) => setForm((f) => ({ ...f, partner_type: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PARTNER_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt} className="capitalize">{opt.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Discount</Label><Input value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. 20% off" /></div>
            <div><Label>Discount Label</Label><Input value={form.discount_label} onChange={(e) => setForm((f) => ({ ...f, discount_label: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. 20% OFF" /></div>
            <div><Label>Promo Code</Label><Input value={form.discount_code} onChange={(e) => setForm((f) => ({ ...f, discount_code: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. PETSITTER20" /></div>
            <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div>
              <Label className="mb-2 block">Images</Label>
              <GalleryImageUpload
                coverUrl={form.image_url}
                galleryUrls={form.gallery}
                onChange={(cover, gallery) => setForm((f) => ({ ...f, image_url: cover, gallery }))}
                category="partners"
                label="Upload Deal Photos"
              />
            </div>
            <div><Label>Link URL</Label><Input value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} className="rounded-xl mt-1" /></div>
            <Button type="submit" disabled={saving} className="w-full rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Deal"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AdminRecordViewDialog
        row={viewingDeal}
        title="Partner Deal"
        titleKey="title"
        fields={FIELDS}
        imageKey="image_url"
        badges={(row) => (
          <span className="text-[10px] rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
            {row.is_active ? "Active" : "Inactive"}
          </span>
        )}
        onOpenChange={(open) => !open && setViewingDeal(null)}
      />
      <AdminRecordEditDialog
        row={editingDeal}
        title="Edit Partner Deal"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingDeal(null)}
      />
    </div>
  );
}
