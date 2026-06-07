"use client";

import { useState } from "react";
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

const STATUSES = ["pending", "approved", "rejected"];
const FIELDS: AdminRecordField[] = [
  { key: "pet_id", label: "Pet ID", viewOnly: true },
  { key: "applicant_name", label: "Applicant Name", required: true },
  { key: "applicant_email", label: "Applicant Email", required: true },
  { key: "applicant_phone", label: "Applicant Phone" },
  { key: "message", label: "Message", type: "textarea", className: "col-span-2" },
  { key: "status", label: "Status", type: "select", options: STATUSES },
];

export default function AdminAdoptionRequests() {
  const { data: requests = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.adoption_requests,
    "admin-adoption-requests"
  );
  const [viewingRequest, setViewingRequest] = useState<Row | null>(null);
  const [editingRequest, setEditingRequest] = useState<Row | null>(null);

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
          { key: "applicant_phone", label: "Phone" },
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
        onView={setViewingRequest}
        onEdit={setEditingRequest}
        rowActions={(row) => (
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
        )}
        onDelete={(row) =>
          deleteRow(String(row.id), `Delete request from ${row.applicant_name}?`)
        }
      />

      <AdminRecordViewDialog
        row={viewingRequest}
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
