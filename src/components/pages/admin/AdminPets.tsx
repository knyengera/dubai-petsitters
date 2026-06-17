"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import {
  AdminRecordEditDialog,
  AdminRecordViewDialog,
  type AdminRecordField,
} from "@/components/admin/AdminRecordDialogs";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import ImageUpload from "@/components/common/ImageUpload";
import { useAuth } from "@/lib/auth-context";

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

const STATUSES = ["available", "pending_review", "pending", "adopted"];
const SPECIES = ["dog", "cat", "bird", "rabbit", "fish", "reptile", "other"];
const FIELDS: AdminRecordField[] = [
  { key: "name", label: "Name", required: true },
  { key: "species", label: "Species", type: "select", options: SPECIES, required: true },
  { key: "breed", label: "Breed" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender", type: "select", options: ["male", "female"] },
  { key: "size", label: "Size", type: "select", options: ["small", "medium", "large"] },
  { key: "description", label: "Description", type: "textarea", className: "col-span-2" },
  { key: "image_url", label: "Photo", type: "image", hideInView: true, uploadCategory: "pets" },
  { key: "location", label: "Location" },
  { key: "vaccinated", label: "Vaccinated", type: "checkbox" },
  { key: "neutered", label: "Neutered", type: "checkbox" },
  { key: "status", label: "Status", type: "select", options: STATUSES },
  { key: "created_by", label: "Listed By" },
];

export default function AdminPets() {
  const { user } = useAuth();
  const { data: pets = [], isLoading, updateRow, deleteRow, createRow } = useAdminList(
    ADMIN_TABLES.pets,
    "admin-pets"
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [viewingPet, setViewingPet] = useState<Row | null>(null);
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

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Adoption Pets"
        description="Manage pets listed for adoption."
        actions={
          <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Pet
          </Button>
        }
      />
      <AdminDataList
        rows={pets}
        isLoading={isLoading}
        columns={[
          { key: "name", label: "Name" },
          { key: "species", label: "Species" },
          { key: "breed", label: "Breed" },
          { key: "location", label: "Location" },
          {
            key: "created_by",
            label: "Listed By",
            render: (row) => (
              <span className="text-xs text-muted-foreground">
                {String(row.created_by ?? "—")}
              </span>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <Badge variant="secondary" className="capitalize text-[10px]">
                {String(row.status)}
              </Badge>
            ),
          },
        ]}
        onView={setViewingPet}
        onEdit={setEditingPet}
        rowActions={(row) => (
          <Select
            value={String(row.status ?? "available")}
            onValueChange={(v) => updateRow(String(row.id), { status: v }, "Status updated")}
          >
            <SelectTrigger className="w-28 h-8 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        onDelete={(row) => deleteRow(String(row.id), `Delete ${row.name}?`)}
      />

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
                      <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
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

      <AdminRecordViewDialog
        row={viewingPet}
        title="Adoption Pet"
        titleKey="name"
        fields={FIELDS}
        imageKey="image_url"
        badges={(row) => (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {String(row.status ?? "available")}
          </Badge>
        )}
        onOpenChange={(open) => !open && setViewingPet(null)}
      />
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
