"use client";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES } from "@/lib/admin/tables";

const STATUSES = ["pending", "approved", "rejected"];

export default function AdminAdoptionRequests() {
  const { data: requests = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.adoption_requests,
    "admin-adoption-requests"
  );

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
    </div>
  );
}
