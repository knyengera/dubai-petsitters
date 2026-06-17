"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { AdminRecordEditDialog } from "@/components/admin/AdminRecordDialogs";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { LOST_PET_FIELDS, LOST_PET_STATUSES } from "@/components/pages/admin/lost-pet-fields";

const STATUSES = LOST_PET_STATUSES;
const FIELDS = LOST_PET_FIELDS;

export default function AdminLostPets() {
  const router = useRouter();
  const { data: reports = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.lost_pets,
    "admin-lost-pets"
  );
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
        onView={(row) => router.push(`/admin/lost-pets/${row.id}`)}
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
