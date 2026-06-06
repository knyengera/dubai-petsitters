"use client";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES } from "@/lib/admin/tables";

const STATUSES = ["new", "contacted", "converted", "closed"];

export default function AdminPartnerInquiries() {
  const { data: inquiries = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.partner_inquiries,
    "admin-partner-inquiries"
  );

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Partner Inquiries"
        description="Review partnership and advertising inquiries from /partners."
      />
      <AdminDataList
        rows={inquiries}
        isLoading={isLoading}
        columns={[
          { key: "business_name", label: "Business" },
          { key: "business_type", label: "Type" },
          { key: "contact_name", label: "Contact" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "city", label: "City" },
          { key: "plan", label: "Plan" },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <Badge variant="secondary" className="capitalize text-[10px]">
                {String(row.status ?? "new")}
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
            value={String(row.status ?? "new")}
            onValueChange={(v) => updateRow(String(row.id), { status: v, updated_at: new Date().toISOString() }, "Status updated")}
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
          deleteRow(String(row.id), `Delete inquiry from ${row.business_name}?`)
        }
      />
    </div>
  );
}
