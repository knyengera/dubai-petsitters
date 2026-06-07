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

const STATUSES = ["pending", "pending_payment", "active", "cancelled", "expired"];
const FIELDS: AdminRecordField[] = [
  { key: "clinic_id", label: "Clinic ID", viewOnly: true },
  { key: "clinic_name", label: "Clinic Name" },
  { key: "contact_name", label: "Contact Name" },
  { key: "contact_email", label: "Contact Email" },
  { key: "city", label: "City" },
  { key: "plan", label: "Plan" },
  { key: "status", label: "Status", type: "select", options: STATUSES },
  { key: "amount", label: "Amount", type: "number" },
  { key: "amount_paid", label: "Amount Paid", type: "number" },
  { key: "gateway", label: "Gateway" },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "end_date", label: "End Date", type: "date" },
  { key: "created_by", label: "Created By", viewOnly: true },
];

export default function AdminSubscriptions() {
  const { data: subs = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.vet_subscriptions,
    "admin-subscriptions"
  );
  const [viewingSub, setViewingSub] = useState<Row | null>(null);
  const [editingSub, setEditingSub] = useState<Row | null>(null);

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Subscription updated");

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Vet Subscriptions"
        description="Vet advertising submissions from /vet-advertise."
      />
      <AdminDataList
        rows={subs}
        isLoading={isLoading}
        columns={[
          { key: "clinic_name", label: "Clinic" },
          { key: "contact_name", label: "Contact" },
          { key: "contact_email", label: "Email" },
          { key: "city", label: "City" },
          { key: "plan", label: "Plan" },
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
            key: "amount_paid",
            label: "Amount",
            render: (row) => {
              const amt = row.amount_paid ?? row.amount;
              return amt ? `SAR ${amt}` : "—";
            },
          },
          { key: "gateway", label: "Gateway" },
          { key: "start_date", label: "Start" },
          { key: "end_date", label: "End" },
        ]}
        onView={setViewingSub}
        onEdit={setEditingSub}
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
        onDelete={(row) => deleteRow(String(row.id), "Delete subscription?")}
      />

      <AdminRecordViewDialog
        row={viewingSub}
        title="Vet Subscription"
        titleKey="clinic_name"
        fields={FIELDS}
        badges={(row) => (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {String(row.status ?? "pending")}
          </Badge>
        )}
        onOpenChange={(open) => !open && setViewingSub(null)}
      />
      <AdminRecordEditDialog
        row={editingSub}
        title="Edit Vet Subscription"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingSub(null)}
      />
    </div>
  );
}
