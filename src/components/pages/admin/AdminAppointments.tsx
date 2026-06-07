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

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const FIELDS: AdminRecordField[] = [
  { key: "pet_name", label: "Pet Name", required: true },
  { key: "pet_id", label: "Pet ID", viewOnly: true },
  { key: "clinic_name", label: "Clinic Name" },
  { key: "vet_name", label: "Vet Name" },
  { key: "date", label: "Date", type: "date" },
  { key: "time", label: "Time" },
  { key: "type", label: "Type", required: true },
  { key: "status", label: "Status", type: "select", options: STATUSES },
  { key: "owner_name", label: "Owner Name" },
  { key: "owner_email", label: "Owner Email", required: true },
  { key: "owner_phone", label: "Owner Phone" },
  { key: "fee", label: "Fee", type: "number" },
  { key: "notes", label: "Notes", type: "textarea", className: "col-span-2" },
];

export default function AdminAppointments() {
  const { data: appointments = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.appointments,
    "admin-appointments",
    "-date"
  );
  const [viewingAppointment, setViewingAppointment] = useState<Row | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Row | null>(null);

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Appointment updated");

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Appointments"
        description="Manage vet appointment requests across the platform."
      />
      <AdminDataList
        rows={appointments}
        isLoading={isLoading}
        columns={[
          { key: "pet_name", label: "Pet" },
          { key: "type", label: "Type" },
          { key: "clinic_name", label: "Clinic" },
          { key: "owner_name", label: "Owner" },
          { key: "date", label: "Date" },
          { key: "time", label: "Time" },
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
        onView={setViewingAppointment}
        onEdit={setEditingAppointment}
        rowActions={(row) => (
          <Select
            value={String(row.status ?? "pending")}
            onValueChange={(v) => updateRow(String(row.id), { status: v }, "Status updated")}
          >
            <SelectTrigger className="w-32 h-8 rounded-lg text-xs">
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
          deleteRow(String(row.id), `Delete appointment for ${row.pet_name}?`)
        }
      />

      <AdminRecordViewDialog
        row={viewingAppointment}
        title="Appointment"
        titleKey="pet_name"
        fields={FIELDS}
        badges={(row) => (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {String(row.status ?? "pending")}
          </Badge>
        )}
        onOpenChange={(open) => !open && setViewingAppointment(null)}
      />
      <AdminRecordEditDialog
        row={editingAppointment}
        title="Edit Appointment"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingAppointment(null)}
      />
    </div>
  );
}
