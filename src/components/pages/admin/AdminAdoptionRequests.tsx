"use client";

import { useMemo, useState } from "react";
import { Loader2, Eye, Pencil, Trash2, PawPrint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import {
  AdminRecordEditDialog,
  AdminRecordViewDialog,
  type AdminRecordField,
} from "@/components/admin/AdminRecordDialogs";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import StartChatButton from "@/components/messaging/StartChatButton";

const STATUSES = ["pending", "approved", "rejected"];

const STATUS_GROUPS: { value: string; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  pending: "warning",
  approved: "success",
  rejected: "destructive",
};

const FIELDS: AdminRecordField[] = [
  { key: "pet_name", label: "Pet", viewOnly: true },
  { key: "pet_listed_by", label: "Listed By", viewOnly: true },
  { key: "applicant_name", label: "Applicant Name", required: true },
  { key: "applicant_email", label: "Applicant Email", required: true },
  { key: "applicant_phone", label: "Applicant Phone" },
  { key: "city", label: "City" },
  { key: "housing_type", label: "Housing Type" },
  { key: "has_pets", label: "Has Other Pets", type: "checkbox" },
  { key: "experience", label: "Pet Experience", type: "textarea", className: "col-span-2" },
  { key: "message", label: "Message", type: "textarea", className: "col-span-2" },
  { key: "status", label: "Status", type: "select", options: STATUSES },
];

export default function AdminAdoptionRequests() {
  const { data: requests = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.adoption_requests,
    "admin-adoption-requests"
  );
  const { data: pets = [] } = useAdminList(ADMIN_TABLES.pets, "admin-pets");
  const [viewingRequest, setViewingRequest] = useState<Row | null>(null);
  const [editingRequest, setEditingRequest] = useState<Row | null>(null);

  const petMap = useMemo(() => {
    const map = new Map<string, Row>();
    for (const pet of pets) map.set(String(pet.id), pet);
    return map;
  }, [pets]);

  const petName = (row: Row) => {
    const pet = petMap.get(String(row.pet_id));
    return pet ? String(pet.name) : String(row.pet_name ?? "—");
  };
  const petListedBy = (row: Row) => {
    const pet = petMap.get(String(row.pet_id));
    return pet?.created_by ? String(pet.created_by) : "—";
  };
  const petImage = (row: Row) => {
    const pet = petMap.get(String(row.pet_id));
    return pet?.image_url ? String(pet.image_url) : "";
  };

  const decorate = (row: Row | null): Row | null =>
    row ? { ...row, pet_name: petName(row), pet_listed_by: petListedBy(row) } : null;

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Request updated");

  const groups = useMemo(() => {
    const known = new Set(STATUS_GROUPS.map((g) => g.value));
    const base = STATUS_GROUPS.map((g) => ({
      ...g,
      rows: requests.filter((r) => String(r.status ?? "pending") === g.value),
    }));
    const otherRows = requests.filter((r) => !known.has(String(r.status ?? "pending")));
    if (otherRows.length > 0) base.push({ value: "other", label: "Other", rows: otherRows });
    return base.filter((g) => g.rows.length > 0);
  }, [requests]);

  const pendingCount = requests.filter((r) => String(r.status ?? "pending") === "pending").length;

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Adoption Requests"
        description={`${requests.length} total · ${pendingCount} pending`}
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
          No adoption requests yet.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.value}>
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">
                {group.label} ({group.rows.length})
              </h2>
              <div className="space-y-3">
                {group.rows.map((request) => (
                  <RequestRow
                    key={String(request.id)}
                    request={request}
                    petName={petName(request)}
                    petListedBy={petListedBy(request)}
                    petImage={petImage(request)}
                    onView={() => setViewingRequest(request)}
                    onEdit={() => setEditingRequest(request)}
                    onStatus={(v) => updateRow(String(request.id), { status: v }, "Status updated")}
                    onDelete={() => deleteRow(String(request.id), `Delete request from ${request.applicant_name}?`)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <AdminRecordViewDialog
        row={decorate(viewingRequest)}
        title="Adoption Request"
        titleKey="applicant_name"
        fields={FIELDS}
        badges={(row) => (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {String(row.status ?? "pending")}
          </Badge>
        )}
        onOpenChange={(open) => !open && setViewingRequest(null)}
      />
      <AdminRecordEditDialog
        row={editingRequest}
        title="Edit Adoption Request"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingRequest(null)}
      />
    </div>
  );
}

function RequestRow({
  request,
  petName,
  petListedBy,
  petImage,
  onView,
  onEdit,
  onStatus,
  onDelete,
}: {
  request: Row;
  petName: string;
  petListedBy: string;
  petImage: string;
  onView: () => void;
  onEdit: () => void;
  onStatus: (value: string) => void;
  onDelete: () => void;
}) {
  const status = String(request.status ?? "pending");

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {petImage ? (
        <img src={petImage} alt={petName} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <PawPrint className="w-6 h-6 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2 flex-wrap">
          {String(request.applicant_name ?? "Applicant")}
          <Badge variant={STATUS_BADGE[status] ?? "secondary"} className="text-[10px] capitalize">
            {status}
          </Badge>
        </p>
        <p className="text-xs text-muted-foreground truncate">{String(request.applicant_email ?? "—")}</p>
        <p className="text-xs text-muted-foreground truncate">
          Pet: {petName} · by {petListedBy}
        </p>
        {request.message ? (
          <p className="text-xs text-muted-foreground truncate italic mt-0.5">&ldquo;{String(request.message)}&rdquo;</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Select value={status} onValueChange={onStatus}>
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
        <StartChatButton
          contactId={String(request.id)}
          contactName={String(request.applicant_name ?? "Applicant")}
          contactType="adoption"
          contactEmail={String(request.applicant_email ?? "")}
          subject={`Adoption inquiry for ${petName}`}
          size="sm"
          stopPropagation
        />
        <button type="button" onClick={onView} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="View request">
          <Eye className="w-5 h-5" />
        </button>
        <button type="button" onClick={onEdit} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="Edit request">
          <Pencil className="w-5 h-5" />
        </button>
        <button type="button" onClick={onDelete} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Delete request">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
