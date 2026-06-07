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

const STATUSES = ["new", "contacted", "converted", "closed"];
const FIELDS: AdminRecordField[] = [
  { key: "business_name", label: "Business Name", required: true },
  { key: "business_type", label: "Business Type" },
  { key: "contact_name", label: "Contact Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "city", label: "City" },
  { key: "plan", label: "Plan" },
  { key: "message", label: "Message", type: "textarea", className: "col-span-2" },
  { key: "status", label: "Status", type: "select", options: STATUSES },
];

export default function AdminPartnerInquiries() {
  const { data: inquiries = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.partner_inquiries,
    "admin-partner-inquiries"
  );
  const [viewingInquiry, setViewingInquiry] = useState<Row | null>(null);
  const [editingInquiry, setEditingInquiry] = useState<Row | null>(null);

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Inquiry updated");

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
        onView={setViewingInquiry}
        onEdit={setEditingInquiry}
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

      <AdminRecordViewDialog
        row={viewingInquiry}
        title="Partner Inquiry"
        titleKey="business_name"
        fields={FIELDS}
        badges={(row) => (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {String(row.status ?? "new")}
          </Badge>
        )}
        onOpenChange={(open) => !open && setViewingInquiry(null)}
      />
      <AdminRecordEditDialog
        row={editingInquiry}
        title="Edit Partner Inquiry"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingInquiry(null)}
      />
    </div>
  );
}
