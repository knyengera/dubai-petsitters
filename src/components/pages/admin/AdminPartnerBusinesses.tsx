"use client";

import { useState } from "react";
import {
  CheckCircle,
  Plus,
  Stethoscope,
  Loader2,
  Trash2,
  Star,
  Eye,
  Pencil,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GalleryImageUpload from "@/components/common/GalleryImageUpload";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import PartnerTypeFields from "@/components/partners/PartnerTypeFields";
import { useAdminPaginatedList } from "@/components/admin/useAdminPaginatedList";
import { getAdminListConfig } from "@/lib/admin/list-config";
import { useToast } from "@/components/ui/use-toast";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import {
  PARTNER_TYPES,
  type BusinessDetails,
  type PartnerTypeId,
  getPartnerTypeLabel,
  getPartnerTypeIdFromLabel,
  validateBusinessDetails,
  formatBusinessDetailsForDisplay,
} from "@/lib/partners/partner-types";

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
  gallery: [] as string[],
};

type PartnerForm = typeof EMPTY_FORM;

const DEFAULT_TYPE: PartnerTypeId = "vet-clinics";

const COMMON_DETAIL_FIELDS = [
  ["name", "Business Name"],
  ["city", "City"],
  ["address", "Address"],
  ["phone", "Phone"],
  ["email", "Email"],
  ["website", "Website"],
  ["rating", "Rating"],
  ["latitude", "Latitude"],
  ["longitude", "Longitude"],
] as const;

const VET_DETAIL_FIELDS = [
  ["services", "Services"],
  ["specialties", "Specialties"],
  ["opening_hours", "Opening Hours"],
  ["emergency_available", "Emergency"],
] as const;

const WIDE_DIALOG_CLASS =
  "w-[min(1120px,calc(100vw-2rem))] max-w-none sm:max-w-none rounded-2xl max-h-[90vh] overflow-y-auto";

const LIST_CONFIG = getAdminListConfig(ADMIN_TABLES.vet_clinics);

export default function AdminPartnerBusinesses() {
  const {
    rows: partners,
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
  } = useAdminPaginatedList(ADMIN_TABLES.vet_clinics, "admin-partners");
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PartnerForm>(EMPTY_FORM);
  const [businessTypeId, setBusinessTypeId] = useState<PartnerTypeId>(DEFAULT_TYPE);
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({});
  const [detailErrors, setDetailErrors] = useState<Record<string, string>>({});
  const [editingPartner, setEditingPartner] = useState<Row | null>(null);
  const [viewingPartner, setViewingPartner] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const isVet = businessTypeId === "vet-clinics";

  const handleApprove = async (partner: Row) => {
    const nextApproved = !partner.is_approved;
    const updatedAt = new Date().toISOString();
    const updated = await updateRow(
      String(partner.id),
      { is_approved: nextApproved, updated_at: updatedAt },
      partner.is_approved ? "Approval removed" : `${partner.name} approved!`
    );
    if (updated && viewingPartner?.id === partner.id) {
      setViewingPartner({ ...viewingPartner, is_approved: nextApproved, updated_at: updatedAt });
    }
  };

  const handleFeature = async (partner: Row) => {
    const nextFeatured = !partner.is_featured;
    const updatedAt = new Date().toISOString();
    const updated = await updateRow(String(partner.id), {
      is_featured: nextFeatured,
      updated_at: updatedAt,
    });
    if (updated && viewingPartner?.id === partner.id) {
      setViewingPartner({ ...viewingPartner, is_featured: nextFeatured, updated_at: updatedAt });
    }
  };

  const handleDelete = async (partner: Row) => {
    await deleteRow(String(partner.id), `Delete ${partner.name}?`);
  };

  const openCreate = () => {
    setEditingPartner(null);
    setForm({ ...EMPTY_FORM, is_approved: true });
    setBusinessTypeId(DEFAULT_TYPE);
    setBusinessDetails({});
    setDetailErrors({});
    setShowForm(true);
  };

  const openEdit = (partner: Row) => {
    setViewingPartner(null);
    setEditingPartner(partner);
    setForm(rowToForm(partner));
    setBusinessTypeId(getPartnerTypeIdFromLabel(String(partner.business_type ?? "")) ?? DEFAULT_TYPE);
    setBusinessDetails(
      partner.business_details && typeof partner.business_details === "object"
        ? (partner.business_details as BusinessDetails)
        : {}
    );
    setDetailErrors({});
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateBusinessDetails(businessTypeId, businessDetails);
    if (!validation.success) {
      setDetailErrors(validation.errors);
      toast({
        title: "Missing information",
        description:
          Object.values(validation.errors)[0] ?? "Please complete all required business details.",
        variant: "destructive",
      });
      return;
    }
    setDetailErrors({});

    setSaving(true);
    const payload = formToPayload(form, businessTypeId, validation.data);
    const saved = editingPartner
      ? await updateRow(String(editingPartner.id), payload, `${form.name} updated`)
      : await createRow(payload, `${form.name} added`);

    if (saved) {
      setForm({ ...EMPTY_FORM, is_approved: true });
      setBusinessTypeId(DEFAULT_TYPE);
      setBusinessDetails({});
      setEditingPartner(null);
      setShowForm(false);
    }
    setSaving(false);
  };

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Partners"
        description={`${total} partners`}
        actions={
          <Button onClick={openCreate} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Partner
          </Button>
        }
      />

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, city, email, or phone..."
        filters={(LIST_CONFIG.filters ?? []).map((f) => ({
          key: f.key,
          value: filters[f.key] ?? "all",
          options: f.options,
          allLabel: f.key === "business_type" ? "All types" : "All",
        }))}
        onFilterChange={setFilter}
        total={total}
        page={page}
        pageSize={pageSize}
        resultNoun="partners"
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : partners.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
          No partners found.
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map((partner) => (
            <PartnerRow
              key={String(partner.id)}
              partner={partner}
              onView={setViewingPartner}
              onEdit={openEdit}
              onApprove={handleApprove}
              onFeature={handleFeature}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <AdminPagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className={WIDE_DIALOG_CLASS}>
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingPartner ? "Edit Partner" : "Add Partner"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div>
              <Label className="mb-1.5 block">Business Type *</Label>
              <Select
                value={businessTypeId}
                onValueChange={(value) => {
                  setBusinessTypeId(value as PartnerTypeId);
                  setBusinessDetails({});
                  setDetailErrors({});
                }}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PARTNER_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="mb-1.5 block">Business Name *</Label>
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

              {isVet && (
                <>
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
                </>
              )}

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
            </div>

            <div className="pt-2 border-t border-border">
              <PartnerTypeFields
                businessTypeId={businessTypeId}
                details={businessDetails}
                onChange={setBusinessDetails}
                errors={detailErrors}
              />
            </div>

            <div>
              <Label className="mb-2 block">Photos</Label>
              <GalleryImageUpload
                coverUrl={form.image_url}
                galleryUrls={form.gallery}
                onChange={(cover, gallery) => setForm((f) => ({ ...f, image_url: cover, gallery }))}
                category="partners"
                label="Upload Business Photos"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {isVet && (
                <div className="flex items-center gap-2 rounded-xl border border-border p-3">
                  <input type="checkbox" id="emergency" checked={form.emergency_available} onChange={(e) => setForm((f) => ({ ...f, emergency_available: e.target.checked }))} />
                  <Label htmlFor="emergency">Emergency Available</Label>
                </div>
              )}
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
                  setEditingPartner(null);
                }}
                className="flex-1 rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="flex-1 rounded-xl">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingPartner ? "Save Changes" : "Add Partner"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewingPartner)} onOpenChange={(open) => !open && setViewingPartner(null)}>
        <DialogContent className={WIDE_DIALOG_CLASS}>
          {viewingPartner ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading flex flex-wrap items-center gap-2">
                  {String(viewingPartner.name ?? "Partner")}
                  {viewingPartner.is_approved ? <Badge variant="success">Approved</Badge> : <Badge variant="secondary">Pending</Badge>}
                  {viewingPartner.is_featured ? <Badge variant="warning">Featured</Badge> : null}
                  {viewingPartner.business_type ? (
                    <Badge variant="outline">{String(viewingPartner.business_type)}</Badge>
                  ) : null}
                </DialogTitle>
              </DialogHeader>

              {viewingPartner.image_url ? (
                <img
                  src={String(viewingPartner.image_url)}
                  alt={String(viewingPartner.name ?? "Partner")}
                  className="h-48 w-full rounded-2xl object-cover"
                />
              ) : null}

              {Array.isArray(viewingPartner.gallery) && viewingPartner.gallery.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {viewingPartner.gallery.map((url) => (
                    <img
                      key={String(url)}
                      src={String(url)}
                      alt="Partner gallery"
                      className="aspect-square w-full rounded-lg object-cover"
                    />
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" className="rounded-xl gap-1" onClick={() => handleApprove(viewingPartner)}>
                  <CheckCircle className="w-3.5 h-3.5" />
                  {viewingPartner.is_approved ? "Remove Approval" : "Approve"}
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => handleFeature(viewingPartner)}>
                  <Star className="w-3.5 h-3.5" />
                  {viewingPartner.is_featured ? "Unfeature" : "Feature"}
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-xl gap-1" onClick={() => openEdit(viewingPartner)}>
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
                {viewingPartner.website ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-xl gap-1"
                    onClick={() => window.open(String(viewingPartner.website), "_blank", "noreferrer")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Website
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {COMMON_DETAIL_FIELDS.map(([key, label]) => (
                  <DetailItem key={key} label={label} value={viewingPartner[key]} />
                ))}
                {getPartnerTypeIdFromLabel(String(viewingPartner.business_type ?? "")) === "vet-clinics" &&
                  VET_DETAIL_FIELDS.map(([key, label]) => (
                    <DetailItem key={key} label={label} value={viewingPartner[key]} />
                  ))}
              </div>

              <PartnerDetailsPanel row={viewingPartner} />
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PartnerDetailsPanel({ row }: { row: Row }) {
  const details = row.business_details as BusinessDetails | null | undefined;
  const rows = formatBusinessDetailsForDisplay(String(row.business_type ?? ""), details).filter(
    (r) => r.label !== "Business Type"
  );
  if (rows.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <p className="col-span-full font-heading font-semibold text-sm text-foreground">Business Details</p>
      {rows.map(({ label, value }) => (
        <div key={label} className="rounded-xl border border-border bg-muted/20 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
          <p className="text-sm text-foreground break-words">{value}</p>
        </div>
      ))}
    </div>
  );
}

function PartnerRow({
  partner,
  onView,
  onEdit,
  onApprove,
  onFeature,
  onDelete,
}: {
  partner: Row;
  onView: (partner: Row) => void;
  onEdit: (partner: Row) => void;
  onApprove: (partner: Row) => void;
  onFeature: (partner: Row) => void;
  onDelete: (partner: Row) => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {partner.image_url ? (
        <img src={String(partner.image_url)} alt={String(partner.name)} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-success-muted flex items-center justify-center shrink-0">
          <Stethoscope className="w-6 h-6 text-success" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2 flex-wrap">
          {String(partner.name)}
          {partner.business_type ? <Badge variant="outline" className="text-[10px]">{String(partner.business_type)}</Badge> : null}
          {partner.is_approved && <Badge variant="success" className="text-[10px]">Approved</Badge>}
          {partner.is_featured && <Badge variant="warning" className="text-[10px]">Featured</Badge>}
        </p>
        <p className="text-xs text-muted-foreground">
          {String(partner.city)}{partner.address ? ` · ${partner.address}` : ""}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {[partner.phone, partner.email, partner.opening_hours].filter(Boolean).map(String).join(" · ") || "No contact details"}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button type="button" onClick={() => onView(partner)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="View partner record">
          <Eye className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onEdit(partner)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="Edit partner record">
          <Pencil className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onApprove(partner)} className={`p-2 rounded-lg transition-colors ${partner.is_approved ? "text-success bg-success-muted" : "text-muted-foreground hover:text-success hover:bg-success-muted"}`} aria-label={partner.is_approved ? "Remove approval" : "Approve partner"}>
          <CheckCircle className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onFeature(partner)} className={`p-2 rounded-lg transition-colors ${partner.is_featured ? "text-warning bg-warning-muted" : "text-muted-foreground hover:text-warning hover:bg-warning-muted"}`} aria-label={partner.is_featured ? "Remove featured status" : "Feature partner"}>
          <Star className="w-5 h-5" />
        </button>
        <button type="button" onClick={() => onDelete(partner)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Delete partner record">
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

function rowToForm(row: Row): PartnerForm {
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
    gallery: Array.isArray(row.gallery) ? row.gallery.map(String).filter(Boolean) : [],
  };
}

function formToPayload(
  form: PartnerForm,
  businessTypeId: PartnerTypeId,
  businessDetails: BusinessDetails
): Row {
  const isVet = businessTypeId === "vet-clinics";
  return {
    name: form.name.trim(),
    city: form.city.trim(),
    address: optionalText(form.address),
    phone: optionalText(form.phone),
    email: optionalText(form.email),
    website: optionalText(form.website),
    services: isVet ? listFromInput(form.services) : [],
    specialties: isVet ? listFromInput(form.specialties) : [],
    opening_hours: isVet ? optionalText(form.opening_hours) : null,
    rating: optionalNumber(form.rating),
    latitude: optionalNumber(form.latitude),
    longitude: optionalNumber(form.longitude),
    emergency_available: isVet ? form.emergency_available : false,
    is_featured: form.is_featured,
    is_approved: form.is_approved,
    image_url: optionalText(form.image_url),
    gallery: form.gallery,
    business_type: getPartnerTypeLabel(businessTypeId),
    business_details: businessDetails,
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
