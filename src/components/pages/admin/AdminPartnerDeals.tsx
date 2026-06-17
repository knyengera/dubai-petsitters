"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import GalleryImageUpload from "@/components/common/GalleryImageUpload";
import {
  AdminRecordEditDialog,
  AdminRecordViewDialog,
  type AdminRecordField,
} from "@/components/admin/AdminRecordDialogs";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";

const EMPTY = {
  title: "",
  description: "",
  partner_name: "",
  discount: "",
  image_url: "",
  gallery: [] as string[],
  link_url: "",
  is_active: true,
};
const FIELDS: AdminRecordField[] = [
  { key: "title", label: "Title", required: true },
  { key: "description", label: "Description", type: "textarea", className: "col-span-2" },
  { key: "partner_name", label: "Partner" },
  { key: "discount", label: "Discount" },
  { key: "gallery", label: "Images", type: "gallery", coverKey: "image_url", galleryKey: "gallery", hideInView: true, uploadCategory: "partners" },
  { key: "link_url", label: "Link URL" },
  { key: "is_active", label: "Active", type: "checkbox" },
];

export default function AdminPartnerDeals() {
  const { data: deals = [], isLoading, updateRow, deleteRow, createRow } = useAdminList(
    ADMIN_TABLES.partner_deals,
    "admin-partner-deals"
  );
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
      <AdminDataList
        rows={deals}
        isLoading={isLoading}
        columns={[
          { key: "title", label: "Title" },
          { key: "partner_name", label: "Partner" },
          { key: "discount", label: "Discount" },
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

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Partner Deal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div><Label>Title *</Label><Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div><Label>Partner</Label><Input value={form.partner_name} onChange={(e) => setForm((f) => ({ ...f, partner_name: e.target.value }))} className="rounded-xl mt-1" /></div>
            <div><Label>Discount</Label><Input value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. 20% off" /></div>
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
