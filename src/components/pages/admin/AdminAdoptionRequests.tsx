"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import {
  AdminRecordEditDialog,
  AdminRecordViewDialog,
  type AdminRecordField,
} from "@/components/admin/AdminRecordDialogs";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import StartChatButton from "@/components/messaging/StartChatButton";

const STATUSES = ["pending", "approved", "rejected"];
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

  const decorate = (row: Row | null): Row | null =>
    row ? { ...row, pet_name: petName(row), pet_listed_by: petListedBy(row) } : null;

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Request updated");

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Adoption Requests"
        description="Review and process adoption applications."
      />
      <AdminDataList
        rows={requests}
        isLoading={isLoading}
        columns={[
          { key: "applicant_name", label: "Applicant" },
          { key: "applicant_email", label: "Email" },
          {
            key: "pet_id",
            label: "Pet",
            render: (row) => (
              <div>
                <p className="text-sm text-foreground">{petName(row)}</p>
                <p className="text-[11px] text-muted-foreground">by {petListedBy(row)}</p>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <Badge variant="secondary" className="capitalize text-[10px]">
                {String(row.status ?? "pending")}
              </Badge>
            ),
          },
          {
            key: "message",
            label: "Message",
            className: "col-span-2",
          },
        ]}
        onView={(row) => setViewingRequest(row)}
        onEdit={(row) => setEditingRequest(row)}
        rowActions={(row) => (
          <div className="flex items-center gap-2">
            <Select
              value={String(row.status ?? "pending")}
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
            <StartChatButton
              contactId={String(row.id)}
              contactName={String(row.applicant_name ?? "Applicant")}
              contactType="adoption"
              contactEmail={String(row.applicant_email ?? "")}
              subject={`Adoption inquiry for ${petName(row)}`}
              size="sm"
              stopPropagation
            />
          </div>
        )}
        onDelete={(row) =>
          deleteRow(String(row.id), `Delete request from ${row.applicant_name}?`)
        }
      />

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
