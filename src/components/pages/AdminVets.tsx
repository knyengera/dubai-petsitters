"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Plus, Stethoscope, Loader2, Trash2, Star } from "lucide-react";
import ImageUpload from "@/components/common/ImageUpload";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";

const EMPTY_FORM = {
  name: "",
  city: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  opening_hours: "",
  emergency_available: false,
  is_featured: false,
  image_url: "",
};

export default function AdminVets() {
  const { data: vets = [], isLoading, updateRow, deleteRow, createRow } = useAdminList(
    ADMIN_TABLES.vet_clinics,
    "admin-vets"
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleApprove = async (vet: Row) => {
    await updateRow(
      String(vet.id),
      { is_approved: !vet.is_approved },
      vet.is_approved ? "Approval removed" : `${vet.name} approved!`
    );
  };

  const handleFeature = async (vet: Row) => {
    await updateRow(String(vet.id), { is_featured: !vet.is_featured });
  };

  const handleDelete = async (vet: Row) => {
    await deleteRow(String(vet.id), `Delete ${vet.name}?`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const created = await createRow({ ...form, is_approved: true }, `${form.name} added & approved!`);
    if (created) {
      setForm(EMPTY_FORM);
      setShowForm(false);
    }
    setSaving(false);
  };

  const approved = vets.filter((v) => v.is_approved);
  const pending = vets.filter((v) => !v.is_approved);

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Vet Clinics"
        description={`${approved.length} approved · ${pending.length} pending`}
        actions={
          <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Vet
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" /> Approved ({approved.length})
            </h2>
            <div className="space-y-3">
              {approved.map((vet) => (
                <VetRow key={String(vet.id)} vet={vet} onApprove={handleApprove} onFeature={handleFeature} onDelete={handleDelete} />
              ))}
              {approved.length === 0 && <p className="text-sm text-muted-foreground">No approved vets yet.</p>}
            </div>
          </section>

          {pending.length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-orange-400" /> Pending ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((vet) => (
                  <VetRow key={String(vet.id)} vet={vet} onApprove={handleApprove} onFeature={handleFeature} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Add Trusted Vet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="mb-1.5 block">Clinic Name *</Label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">City *</Label>
                <Input required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">Website</Label>
                <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="rounded-xl" placeholder="https://" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Address</Label>
                <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Opening Hours</Label>
                <Input value={form.opening_hours} onChange={(e) => setForm((f) => ({ ...f, opening_hours: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="col-span-2 flex flex-col items-center">
                <Label className="mb-2 block self-start">Clinic Photo</Label>
                <ImageUpload value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} label="Upload Clinic Photo" variant="wide" className="w-full" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="emergency" checked={form.emergency_available} onChange={(e) => setForm((f) => ({ ...f, emergency_available: e.target.checked }))} />
                <Label htmlFor="emergency">Emergency Available</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="featured" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} />
                <Label htmlFor="featured">Featured</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add & Approve"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VetRow({
  vet,
  onApprove,
  onFeature,
  onDelete,
}: {
  vet: Row;
  onApprove: (vet: Row) => void;
  onFeature: (vet: Row) => void;
  onDelete: (vet: Row) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
      {vet.image_url ? (
        <img src={String(vet.image_url)} alt={String(vet.name)} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <Stethoscope className="w-6 h-6 text-emerald-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2">
          {String(vet.name)}
          {vet.is_approved && <Badge className="text-[10px] bg-emerald-500 text-white">Approved</Badge>}
          {vet.is_featured && <Badge className="text-[10px] bg-amber-500 text-white">Featured</Badge>}
        </p>
        <p className="text-xs text-muted-foreground">
          {String(vet.city)}{vet.address ? ` · ${vet.address}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button type="button" onClick={() => onApprove(vet)} className={`p-2 rounded-lg transition-colors ${vet.is_approved ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"}`}>
          <CheckCircle className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onFeature(vet)} className={`p-2 rounded-lg transition-colors ${vet.is_featured ? "text-amber-500 bg-amber-50" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"}`}>
          <Star className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onDelete(vet)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
