"use client";

import { useState } from "react";
import {
  CheckCircle,
  Eye,
  Home,
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageUpload from "@/components/common/ImageUpload";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";

const EMPTY_FORM = {
  full_name: "",
  city: "",
  neighborhood: "",
  bio: "",
  services: "",
  accepted_pet_types: "",
  price_per_night: "",
  price_per_day: "",
  rating: "",
  review_count: "",
  response_time: "",
  max_pets: "",
  has_yard: false,
  non_smoking: true,
  is_available: true,
  is_featured: false,
  languages: "",
  photo_url: "",
  gallery: "",
  created_by: "",
};

type HostForm = typeof EMPTY_FORM;

const DETAIL_FIELDS = [
  ["full_name", "Host Name"],
  ["city", "City"],
  ["neighborhood", "Neighborhood"],
  ["bio", "Bio"],
  ["services", "Services"],
  ["accepted_pet_types", "Accepted Pets"],
  ["price_per_night", "Price / Night"],
  ["price_per_day", "Price / Day"],
  ["rating", "Rating"],
  ["review_count", "Reviews"],
  ["response_time", "Response Time"],
  ["max_pets", "Max Pets"],
  ["has_yard", "Has Yard"],
  ["non_smoking", "Non-Smoking"],
  ["is_featured", "Featured"],
  ["languages", "Languages"],
  ["created_by", "Created By"],
] as const;

const WIDE_DIALOG_CLASS =
  "w-[min(1120px,calc(100vw-2rem))] max-w-none sm:max-w-none rounded-2xl max-h-[90vh] overflow-y-auto";

export default function AdminHosts() {
  const { data: hosts = [], isLoading, updateRow, deleteRow, createRow } = useAdminList(
    ADMIN_TABLES.pet_hosts,
    "admin-hosts",
    "-rating"
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingHost, setEditingHost] = useState<Row | null>(null);
  const [viewingHost, setViewingHost] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const available = hosts.filter((host) => host.is_available);
  const unavailable = hosts.length - available.length;

  const handleAvailability = async (host: Row) => {
    const nextAvailable = !host.is_available;
    const updatedAt = new Date().toISOString();
    const updated = await updateRow(String(host.id), {
      is_available: nextAvailable,
      updated_at: updatedAt,
    });
    if (updated && viewingHost?.id === host.id) {
      setViewingHost({ ...viewingHost, is_available: nextAvailable, updated_at: updatedAt });
    }
  };

  const handleFeature = async (host: Row) => {
    const nextFeatured = !host.is_featured;
    const updatedAt = new Date().toISOString();
    const updated = await updateRow(String(host.id), {
      is_featured: nextFeatured,
      updated_at: updatedAt,
    });
    if (updated && viewingHost?.id === host.id) {
      setViewingHost({ ...viewingHost, is_featured: nextFeatured, updated_at: updatedAt });
    }
  };

  const handleDelete = async (host: Row) => {
    await deleteRow(String(host.id), `Delete host ${host.full_name}?`);
  };

  const openCreate = () => {
    setEditingHost(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (host: Row) => {
    setViewingHost(null);
    setEditingHost(host);
    setForm(rowToForm(host));
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = formToPayload(form);
    const saved = editingHost
      ? await updateRow(String(editingHost.id), payload, `${form.full_name} updated`)
      : await createRow(payload, `${form.full_name} added`);

    if (saved) {
      setForm(EMPTY_FORM);
      setEditingHost(null);
      setShowForm(false);
    }
    setSaving(false);
  };

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Pet Hosts"
        description={`${available.length} available · ${unavailable} unavailable`}
        actions={
          <Button onClick={openCreate} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Host
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : hosts.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
          No hosts found.
        </div>
      ) : (
        <div className="space-y-3">
          {hosts.map((host) => (
            <HostRow
              key={String(host.id)}
              host={host}
              onView={setViewingHost}
              onEdit={openEdit}
              onAvailability={handleAvailability}
              onFeature={handleFeature}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className={WIDE_DIALOG_CLASS}>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingHost ? "Edit Pet Host" : "Add Pet Host"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="mb-1.5 block">Host Name *</Label>
                <Input required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">City *</Label>
                <Input required value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">Neighborhood</Label>
                <Input value={form.neighborhood} onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Bio</Label>
                <Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className="rounded-xl min-h-24" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Services</Label>
                <Textarea value={form.services} onChange={(e) => setForm((f) => ({ ...f, services: e.target.value }))} className="rounded-xl min-h-20" placeholder="Comma-separated, e.g. boarding, daycare, dog_walking" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Accepted Pet Types</Label>
                <Textarea value={form.accepted_pet_types} onChange={(e) => setForm((f) => ({ ...f, accepted_pet_types: e.target.value }))} className="rounded-xl min-h-20" placeholder="Comma-separated, e.g. dog, cat, rabbit" />
              </div>
              <div>
                <Label className="mb-1.5 block">Price / Night</Label>
                <Input type="number" min="0" step="0.01" value={form.price_per_night} onChange={(e) => setForm((f) => ({ ...f, price_per_night: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">Price / Day</Label>
                <Input type="number" min="0" step="0.01" value={form.price_per_day} onChange={(e) => setForm((f) => ({ ...f, price_per_day: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">Rating</Label>
                <Input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">Review Count</Label>
                <Input type="number" min="0" step="1" value={form.review_count} onChange={(e) => setForm((f) => ({ ...f, review_count: e.target.value }))} className="rounded-xl" />
              </div>
              <div>
                <Label className="mb-1.5 block">Response Time</Label>
                <Input value={form.response_time} onChange={(e) => setForm((f) => ({ ...f, response_time: e.target.value }))} className="rounded-xl" placeholder="Within 1 hour" />
              </div>
              <div>
                <Label className="mb-1.5 block">Max Pets</Label>
                <Input type="number" min="0" step="1" value={form.max_pets} onChange={(e) => setForm((f) => ({ ...f, max_pets: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Languages</Label>
                <Input value={form.languages} onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))} className="rounded-xl" placeholder="Comma-separated, e.g. Arabic, English" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Gallery URLs</Label>
                <Textarea value={form.gallery} onChange={(e) => setForm((f) => ({ ...f, gallery: e.target.value }))} className="rounded-xl min-h-20" placeholder="Comma-separated image URLs" />
              </div>
              <div className="col-span-2">
                <Label className="mb-1.5 block">Created By Email</Label>
                <Input value={form.created_by} onChange={(e) => setForm((f) => ({ ...f, created_by: e.target.value }))} className="rounded-xl" />
              </div>
              <div className="col-span-2 flex flex-col items-center">
                <Label className="mb-2 block self-start">Host Photo</Label>
                <ImageUpload value={form.photo_url} onChange={(url) => setForm((f) => ({ ...f, photo_url: url }))} label="Upload Host Photo" variant="wide" className="w-full" />
              </div>
              <CheckboxField id="has-yard" label="Has Yard" checked={form.has_yard} onChange={(checked) => setForm((f) => ({ ...f, has_yard: checked }))} />
              <CheckboxField id="non-smoking" label="Non-Smoking" checked={form.non_smoking} onChange={(checked) => setForm((f) => ({ ...f, non_smoking: checked }))} />
              <CheckboxField id="available" label="Available" checked={form.is_available} onChange={(checked) => setForm((f) => ({ ...f, is_available: checked }))} />
              <CheckboxField id="featured" label="Featured" checked={form.is_featured} onChange={(checked) => setForm((f) => ({ ...f, is_featured: checked }))} />
            </div>
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditingHost(null);
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingHost ? "Save Changes" : "Add Host"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewingHost)} onOpenChange={(open) => !open && setViewingHost(null)}>
        <DialogContent className={WIDE_DIALOG_CLASS}>
          {viewingHost ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  {String(viewingHost.full_name ?? "Pet Host")}
                  {viewingHost.is_available ? (
                    <Badge className="bg-emerald-500 text-white">Available</Badge>
                  ) : (
                    <Badge variant="secondary">Unavailable</Badge>
                  )}
                  {viewingHost.is_featured ? (
                    <Badge className="bg-amber-500 text-white">Featured</Badge>
                  ) : null}
                </DialogTitle>
              </DialogHeader>

              {viewingHost.photo_url ? (
                <img
                  src={String(viewingHost.photo_url)}
                  alt={String(viewingHost.full_name ?? "Pet host")}
                  className="h-48 w-full rounded-2xl object-cover"
                />
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" className="rounded-xl gap-1" onClick={() => handleAvailability(viewingHost)}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {viewingHost.is_available ? "Disable" : "Enable"}
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => handleFeature(viewingHost)}>
                  <Star className="w-3.5 h-3.5" />
                  {viewingHost.is_featured ? "Unfeature" : "Feature"}
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => openEdit(viewingHost)}>
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {DETAIL_FIELDS.map(([key, label]) => (
                  <DetailItem key={key} label={label} value={viewingHost[key]} />
                ))}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HostRow({
  host,
  onView,
  onEdit,
  onAvailability,
  onFeature,
  onDelete,
}: {
  host: Row;
  onView: (host: Row) => void;
  onEdit: (host: Row) => void;
  onAvailability: (host: Row) => void;
  onFeature: (host: Row) => void;
  onDelete: (host: Row) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {host.photo_url ? (
        <img src={String(host.photo_url)} alt={String(host.full_name)} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Home className="w-6 h-6 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2">
          {String(host.full_name)}
          {host.is_available && <Badge className="text-[10px] bg-emerald-500 text-white">Available</Badge>}
          {host.is_featured && <Badge className="text-[10px] bg-amber-500 text-white">Featured</Badge>}
        </p>
        <p className="text-xs text-muted-foreground">
          {[host.neighborhood, host.city].filter(Boolean).map(String).join(", ") || "No location"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {[
            Array.isArray(host.services) ? host.services.join(", ") : host.services,
            host.price_per_night ? `SAR ${host.price_per_night}/night` : null,
            host.response_time,
          ].filter(Boolean).map(String).join(" · ") || "No service details"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button type="button" onClick={() => onView(host)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="View host record">
          <Eye className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onEdit(host)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="Edit host record">
          <Pencil className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onAvailability(host)} className={`p-2 rounded-lg transition-colors ${host.is_available ? "text-emerald-600 bg-emerald-50" : "text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50"}`} aria-label={host.is_available ? "Disable host" : "Enable host"}>
          <CheckCircle className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onFeature(host)} className={`p-2 rounded-lg transition-colors ${host.is_featured ? "text-amber-500 bg-amber-50" : "text-muted-foreground hover:text-amber-500 hover:bg-amber-50"}`} aria-label={host.is_featured ? "Remove featured status" : "Feature host"}>
          <Star className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onDelete(host)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Delete host record">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function CheckboxField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border p-3">
      <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <Label htmlFor={id}>{label}</Label>
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

function rowToForm(row: Row): HostForm {
  return {
    full_name: toInput(row.full_name),
    city: toInput(row.city),
    neighborhood: toInput(row.neighborhood),
    bio: toInput(row.bio),
    services: arrayToInput(row.services),
    accepted_pet_types: arrayToInput(row.accepted_pet_types),
    price_per_night: toInput(row.price_per_night),
    price_per_day: toInput(row.price_per_day),
    rating: toInput(row.rating),
    review_count: toInput(row.review_count),
    response_time: toInput(row.response_time),
    max_pets: toInput(row.max_pets),
    has_yard: Boolean(row.has_yard),
    non_smoking: row.non_smoking !== false,
    is_available: row.is_available !== false,
    is_featured: Boolean(row.is_featured),
    languages: arrayToInput(row.languages),
    photo_url: toInput(row.photo_url),
    gallery: arrayToInput(row.gallery),
    created_by: toInput(row.created_by),
  };
}

function formToPayload(form: HostForm): Row {
  return {
    full_name: form.full_name.trim(),
    city: form.city.trim(),
    neighborhood: optionalText(form.neighborhood),
    bio: optionalText(form.bio),
    services: listFromInput(form.services),
    accepted_pet_types: listFromInput(form.accepted_pet_types),
    price_per_night: optionalNumber(form.price_per_night),
    price_per_day: optionalNumber(form.price_per_day),
    rating: optionalNumber(form.rating),
    review_count: optionalInteger(form.review_count),
    response_time: optionalText(form.response_time),
    max_pets: optionalInteger(form.max_pets),
    has_yard: form.has_yard,
    non_smoking: form.non_smoking,
    is_available: form.is_available,
    is_featured: form.is_featured,
    languages: listFromInput(form.languages),
    photo_url: optionalText(form.photo_url),
    gallery: listFromInput(form.gallery),
    created_by: optionalText(form.created_by),
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

function optionalInteger(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number.parseInt(trimmed, 10) : null;
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
