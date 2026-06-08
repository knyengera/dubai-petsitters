"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Plus,
  Stethoscope,
  Loader2,
  Trash2,
  Star,
  Eye,
  Pencil,
  ExternalLink,
} from "lucide-react";
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
  services: "",
  specialties: "",
  opening_hours: "",
  rating: "",
  latitude: "",
  longitude: "",
  emergency_available: false,
  is_featured: false,
  is_approved: false,
  image_url: "",
};

type VetForm = typeof EMPTY_FORM;

const DETAIL_FIELDS = [
  ["name", "Clinic Name"],
  ["city", "City"],
  ["address", "Address"],
  ["phone", "Phone"],
  ["email", "Email"],
  ["website", "Website"],
  ["services", "Services"],
  ["specialties", "Specialties"],
  ["opening_hours", "Opening Hours"],
  ["rating", "Rating"],
  ["emergency_available", "Emergency"],
  ["is_featured", "Featured"],
  ["latitude", "Latitude"],
  ["longitude", "Longitude"],
] as const;

const WIDE_DIALOG_CLASS =
  "w-[min(1120px,calc(100vw-2rem))] max-w-none sm:max-w-none rounded-2xl max-h-[90vh] overflow-y-auto";

export default function AdminVets() {
  const { data: vets = [], isLoading, updateRow, deleteRow, createRow } = useAdminList(
    ADMIN_TABLES.vet_clinics,
    "admin-vets"
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingVet, setEditingVet] = useState<Row | null>(null);
  const [viewingVet, setViewingVet] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const handleApprove = async (vet: Row) => {
    const nextApproved = !vet.is_approved;
    const updatedAt = new Date().toISOString();
    const updated = await updateRow(
      String(vet.id),
      { is_approved: nextApproved, updated_at: updatedAt },
      vet.is_approved ? "Approval removed" : `${vet.name} approved!`
    );
    if (updated && viewingVet?.id === vet.id) {
      setViewingVet({ ...viewingVet, is_approved: nextApproved, updated_at: updatedAt });
    }
  };

  const handleFeature = async (vet: Row) => {
    const nextFeatured = !vet.is_featured;
    const updatedAt = new Date().toISOString();
    const updated = await updateRow(String(vet.id), {
      is_featured: nextFeatured,
      updated_at: updatedAt,
    });
    if (updated && viewingVet?.id === vet.id) {
      setViewingVet({ ...viewingVet, is_featured: nextFeatured, updated_at: updatedAt });
    }
  };

  const handleDelete = async (vet: Row) => {
    await deleteRow(String(vet.id), `Delete ${vet.name}?`);
  };

  const openCreate = () => {
    setEditingVet(null);
    setForm({ ...EMPTY_FORM, is_approved: true });
    setShowForm(true);
  };

  const openEdit = (vet: Row) => {
    setViewingVet(null);
    setEditingVet(vet);
    setForm(rowToForm(vet));
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = formToPayload(form);
    const saved = editingVet
      ? await updateRow(String(editingVet.id), payload, `${form.name} updated`)
      : await createRow(payload, `${form.name} added`);

    if (saved) {
      setForm({ ...EMPTY_FORM, is_approved: true });
      setEditingVet(null);
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
          <Button onClick={openCreate} className="rounded-xl gap-2">
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
              <CheckCircle className="w-5 h-5 text-success" /> Approved ({approved.length})
            </h2>
            <div className="space-y-3">
              {approved.map((vet) => (
                <VetRow
                  key={String(vet.id)}
                  vet={vet}
                  onView={setViewingVet}
                  onEdit={openEdit}
                  onApprove={handleApprove}
                  onFeature={handleFeature}
                  onDelete={handleDelete}
                />
              ))}
              {approved.length === 0 && <p className="text-sm text-muted-foreground">No approved vets yet.</p>}
            </div>
          </section>

          {pending.length > 0 && (
            <section>
              <h2 className="font-heading text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-warning" /> Pending ({pending.length})
              </h2>
              <div className="space-y-3">
                {pending.map((vet) => (
                  <VetRow
                    key={String(vet.id)}
                    vet={vet}
                    onView={setViewingVet}
                    onEdit={openEdit}
                    onApprove={handleApprove}
                    onFeature={handleFeature}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className={WIDE_DIALOG_CLASS}>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingVet ? "Edit Vet Clinic" : "Add Trusted Vet"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="col-span-2">
                <Label className="mb-1.5 block">Services</Label>
                <Textarea
                  value={form.services}
                  onChange={(e) => setForm((f) => ({ ...f, services: e.target.value }))}
                  className="rounded-xl min-h-20"
                  placeholder="Comma-separated, e.g. emergency, surgery, vaccination"
                />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Specialties</Label>
                <Textarea
                  value={form.specialties}
                  onChange={(e) => setForm((f) => ({ ...f, specialties: e.target.value }))}
                  className="rounded-xl min-h-20"
                  placeholder="Comma-separated, e.g. Dogs, Cats, Surgery"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Rating</Label>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="col-span-2 flex flex-col items-center">
                <Label className="mb-2 block self-start">Clinic Photo</Label>
                <ImageUpload value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} label="Upload Clinic Photo" variant="wide" className="w-full" />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border p-3">
                <input type="checkbox" id="emergency" checked={form.emergency_available} onChange={(e) => setForm((f) => ({ ...f, emergency_available: e.target.checked }))} />
                <Label htmlFor="emergency">Emergency Available</Label>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border p-3">
                <input type="checkbox" id="featured" checked={form.is_featured} onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))} />
                <Label htmlFor="featured">Featured</Label>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border p-3">
                <input type="checkbox" id="approved" checked={form.is_approved} onChange={(e) => setForm((f) => ({ ...f, is_approved: e.target.checked }))} />
                <Label htmlFor="approved">Approved</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingVet(null);
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingVet ? "Save Changes" : "Add Vet"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewingVet)} onOpenChange={(open) => !open && setViewingVet(null)}>
        <DialogContent className={WIDE_DIALOG_CLASS}>
          {viewingVet ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  {String(viewingVet.name ?? "Vet Clinic")}
                  {viewingVet.is_approved ? (
                    <Badge variant="success">Approved</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              {viewingVet.image_url ? (
                <img
                  src={String(viewingVet.image_url)}
                  alt={String(viewingVet.name ?? "Vet clinic")}
                  className="h-48 w-full rounded-2xl object-cover"
                />
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" className="rounded-xl gap-1" onClick={() => handleApprove(viewingVet)}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {viewingVet.is_approved ? "Remove Approval" : "Approve"}
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => handleFeature(viewingVet)}>
                  <Star className="w-3.5 h-3.5" />
                  {viewingVet.is_featured ? "Unfeature" : "Feature"}
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => openEdit(viewingVet)}>
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
                {viewingVet.website ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl gap-1"
                    onClick={() => window.open(String(viewingVet.website), "_blank", "noreferrer")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Website
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {DETAIL_FIELDS.map(([key, label]) => (
                  <DetailItem key={key} label={label} value={viewingVet[key]} />
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VetRow({
  vet,
  onView,
  onEdit,
  onApprove,
  onFeature,
  onDelete,
}: {
  vet: Row;
  onView: (vet: Row) => void;
  onEdit: (vet: Row) => void;
  onApprove: (vet: Row) => void;
  onFeature: (vet: Row) => void;
  onDelete: (vet: Row) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {vet.image_url ? (
        <img src={String(vet.image_url)} alt={String(vet.name)} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-success-muted flex items-center justify-center shrink-0">
          <Stethoscope className="w-6 h-6 text-success" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2">
          {String(vet.name)}
          {vet.is_approved && <Badge variant="success" className="text-[10px]">Approved</Badge>}
          {vet.is_featured && <Badge variant="warning" className="text-[10px]">Featured</Badge>}
        </p>
        <p className="text-xs text-muted-foreground">
          {String(vet.city)}{vet.address ? ` · ${vet.address}` : ""}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {[vet.phone, vet.email, vet.opening_hours].filter(Boolean).map(String).join(" · ") || "No contact details"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button type="button" onClick={() => onView(vet)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="View vet record">
          <Eye className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onEdit(vet)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="Edit vet record">
          <Pencil className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onApprove(vet)} className={`p-2 rounded-lg transition-colors ${vet.is_approved ? "text-success bg-success-muted" : "text-muted-foreground hover:text-success hover:bg-success-muted"}`} aria-label={vet.is_approved ? "Remove approval" : "Approve vet"}>
          <CheckCircle className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onFeature(vet)} className={`p-2 rounded-lg transition-colors ${vet.is_featured ? "text-warning bg-warning-muted" : "text-muted-foreground hover:text-warning hover:bg-warning-muted"}`} aria-label={vet.is_featured ? "Remove featured status" : "Feature vet"}>
          <Star className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onDelete(vet)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Delete vet record">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <div className="text-sm text-foreground break-words">{formatValue(value)}</div>
    </div>
  );
}

function rowToForm(row: Row): VetForm {
  return {
    name: toInput(row.name),
    city: toInput(row.city),
    address: toInput(row.address),
    phone: toInput(row.phone),
    email: toInput(row.email),
    website: toInput(row.website),
    services: arrayToInput(row.services),
    specialties: arrayToInput(row.specialties),
    opening_hours: toInput(row.opening_hours),
    rating: toInput(row.rating),
    latitude: toInput(row.latitude),
    longitude: toInput(row.longitude),
    emergency_available: Boolean(row.emergency_available),
    is_featured: Boolean(row.is_featured),
    is_approved: Boolean(row.is_approved),
    image_url: toInput(row.image_url),
  };
}

function formToPayload(form: VetForm): Row {
  return {
    name: form.name.trim(),
    city: form.city.trim(),
    address: optionalText(form.address),
    phone: optionalText(form.phone),
    email: optionalText(form.email),
    website: optionalText(form.website),
    services: listFromInput(form.services),
    specialties: listFromInput(form.specialties),
    opening_hours: optionalText(form.opening_hours),
    rating: optionalNumber(form.rating),
    latitude: optionalNumber(form.latitude),
    longitude: optionalNumber(form.longitude),
    emergency_available: form.emergency_available,
    is_featured: form.is_featured,
    is_approved: form.is_approved,
    image_url: optionalText(form.image_url),
    updated_at: new Date().toISOString(),
  };
}

function toInput(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : null;
}

function arrayToInput(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join(", ");
  return toInput(value);
}

function listFromInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-[10px]">
        {value ? "Yes" : "No"}
      </Badge>
    );
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : <span className="text-muted-foreground">—</span>;
  }
  if (typeof value === "object") {
    return <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(value, null, 2)}</pre>;
  }
  return String(value);
}
