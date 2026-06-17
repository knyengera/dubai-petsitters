"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Eye, Pencil, Trash2, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminRecordEditDialog } from "@/components/admin/AdminRecordDialogs";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import ImageUpload from "@/components/common/ImageUpload";
import { useAuth } from "@/lib/auth-context";
import { PET_FIELDS, PET_STATUSES } from "@/components/pages/admin/pet-fields";

const EMPTY = {
  name: "",
  species: "dog",
  breed: "",
  age: "",
  gender: "male",
  size: "medium",
  description: "",
  image_url: "",
  location: "",
  status: "available",
  created_by: "",
};

const STATUSES = PET_STATUSES;
const FIELDS = PET_FIELDS;

const STATUS_GROUPS: { value: string; label: string }[] = [
  { value: "pending_review", label: "Pending Review" },
  { value: "available", label: "Available" },
  { value: "pending", label: "Pending" },
  { value: "adopted", label: "Adopted" },
];

const STATUS_BADGE: Record<string, "success" | "warning" | "secondary" | "outline"> = {
  available: "success",
  pending_review: "warning",
  pending: "outline",
  adopted: "secondary",
};

function cap(value: unknown): string {
  const s = String(value ?? "").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export default function AdminPets() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: pets = [], isLoading, updateRow, deleteRow, createRow } = useAdminList(
    ADMIN_TABLES.pets,
    "admin-pets"
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editingPet, setEditingPet] = useState<Row | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      created_by: form.created_by.trim() || user?.email || "",
    };
    const created = await createRow(payload, `${form.name} added`);
    if (created) {
      setForm(EMPTY);
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Pet updated");

  const groups = useMemo(() => {
    const known = new Set(STATUS_GROUPS.map((g) => g.value));
    const base = STATUS_GROUPS.map((g) => ({
      ...g,
      rows: pets.filter((p) => String(p.status ?? "available") === g.value),
    }));
    const otherRows = pets.filter((p) => !known.has(String(p.status ?? "available")));
    if (otherRows.length > 0) base.push({ value: "other", label: "Other", rows: otherRows });
    return base.filter((g) => g.rows.length > 0);
  }, [pets]);

  const availableCount = pets.filter((p) => String(p.status ?? "available") === "available").length;
  const reviewCount = pets.filter((p) => String(p.status ?? "") === "pending_review").length;

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Adoption Pets"
        description={`${availableCount} available · ${reviewCount} pending review`}
        actions={
          <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Pet
          </Button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
          No pets listed for adoption yet.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.value}>
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">
                {group.label} ({group.rows.length})
              </h2>
              <div className="space-y-3">
                {group.rows.map((pet) => (
                  <PetRow
                    key={String(pet.id)}
                    pet={pet}
                    onView={() => router.push(`/admin/pets/${pet.id}`)}
                    onEdit={() => setEditingPet(pet)}
                    onStatus={(v) => updateRow(String(pet.id), { status: v }, "Status updated")}
                    onDelete={() => deleteRow(String(pet.id), `Delete ${pet.name}?`)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Adoption Pet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex justify-center">
              <ImageUpload value={form.image_url} onChange={(url) => setForm((f) => ({ ...f, image_url: url }))} category="pets" label="Pet Photo" variant="square" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Name *</Label>
                <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Species</Label>
                <Select value={form.species} onValueChange={(v) => setForm((f) => ({ ...f, species: v }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["dog", "cat", "bird", "rabbit", "other"].map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Breed</Label><Input value={form.breed} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))} className="rounded-xl mt-1" /></div>
              <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="rounded-xl mt-1" /></div>
              <div className="col-span-2">
                <Label>Listed By Email</Label>
                <Input
                  type="email"
                  value={form.created_by}
                  onChange={(e) => setForm((f) => ({ ...f, created_by: e.target.value }))}
                  className="rounded-xl mt-1"
                  placeholder={user?.email || "Defaults to your admin email"}
                />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Pet"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AdminRecordEditDialog
        row={editingPet}
        title="Edit Adoption Pet"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingPet(null)}
      />
    </div>
  );
}

function PetRow({
  pet,
  onView,
  onEdit,
  onStatus,
  onDelete,
}: {
  pet: Row;
  onView: () => void;
  onEdit: () => void;
  onStatus: (value: string) => void;
  onDelete: () => void;
}) {
  const status = String(pet.status ?? "available");
  const meta = [cap(pet.breed), pet.age ? String(pet.age) : "", cap(pet.location)].filter(Boolean).join(" · ");

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {pet.image_url ? (
        <img src={String(pet.image_url)} alt={String(pet.name)} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <PawPrint className="w-6 h-6 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2 flex-wrap">
          {String(pet.name)}
          {pet.species ? <Badge variant="outline" className="text-[10px] capitalize">{String(pet.species)}</Badge> : null}
          <Badge variant={STATUS_BADGE[status] ?? "secondary"} className="text-[10px] capitalize">
            {status.replace("_", " ")}
          </Badge>
        </p>
        <p className="text-xs text-muted-foreground truncate">{meta || "No details"}</p>
        <p className="text-xs text-muted-foreground truncate">Listed by {String(pet.created_by ?? "—")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Select value={status} onValueChange={onStatus}>
          <SelectTrigger className="w-32 h-8 rounded-lg text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button type="button" onClick={onView} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="View pet">
          <Eye className="w-5 h-5" />
        </button>
        <button type="button" onClick={onEdit} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="Edit pet">
          <Pencil className="w-5 h-5" />
        </button>
        <button type="button" onClick={onDelete} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Delete pet">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
