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

const STATUSES = ["lost", "found", "reunited"];
const FIELDS: AdminRecordField[] = [
  { key: "pet_name", label: "Pet Name", required: true },
  { key: "species", label: "Species" },
  { key: "breed", label: "Breed" },
  { key: "description", label: "Description", type: "textarea", className: "col-span-2" },
  { key: "image_url", label: "Photo", type: "image", hideInView: true },
  { key: "last_seen_location", label: "Last Seen Location" },
  { key: "last_seen_date", label: "Last Seen Date", type: "date" },
  { key: "contact_name", label: "Contact Name" },
  { key: "contact_phone", label: "Contact Phone" },
  { key: "contact_email", label: "Contact Email" },
  { key: "status", label: "Status", type: "select", options: STATUSES },
  { key: "created_by", label: "Created By", viewOnly: true },
];

export default function AdminLostPets() {
  const { data: reports = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.lost_pets,
    "admin-lost-pets"
  );
  const [viewingReport, setViewingReport] = useState<Row | null>(null);
  const [editingReport, setEditingReport] = useState<Row | null>(null);

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Report updated");

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Lost Pets"
        description="Moderate lost and found pet reports."
      />
      <AdminDataList
        rows={reports}
        isLoading={isLoading}
        columns={[
          { key: "pet_name", label: "Pet" },
          { key: "species", label: "Species" },
          { key: "last_seen_location", label: "Location" },
          { key: "contact_phone", label: "Contact" },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <Badge variant="secondary" className="capitalize text-[10px]">
                {String(row.status ?? "lost")}
              </Badge>
            ),
          },
        ]}
        onView={setViewingReport}
        onEdit={setEditingReport}
        rowActions={(row) => (
          <Select
            value={String(row.status ?? "lost")}
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
          deleteRow(String(row.id), `Delete report for ${row.pet_name}?`)
        }
      />

      <AdminRecordViewDialog
        row={viewingReport}
        title="Lost Pet Report"
        titleKey="pet_name"
        fields={FIELDS}
        imageKey="image_url"
        badges={(row) => (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {String(row.status ?? "lost")}
          </Badge>
        )}
        onOpenChange={(open) => !open && setViewingReport(null)}
      />
      <AdminRecordEditDialog
        row={editingReport}
        title="Edit Lost Pet Report"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingReport(null)}
      />
    </div>
  );
}
