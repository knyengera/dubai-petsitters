"use client";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES } from "@/lib/admin/tables";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

export default function AdminAppointments() {
  const { data: appointments = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.appointments,
    "admin-appointments",
    "-date"
  );

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
    </div>
  );
}
