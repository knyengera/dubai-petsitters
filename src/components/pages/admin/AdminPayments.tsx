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

const STATUSES = ["pending", "completed", "failed", "refunded"];
const FIELDS: AdminRecordField[] = [
  { key: "payment_type", label: "Payment Type", required: true },
  { key: "gateway", label: "Gateway", required: true },
  { key: "amount", label: "Amount", type: "number", required: true },
  { key: "currency", label: "Currency" },
  { key: "status", label: "Status", type: "select", options: STATUSES },
  { key: "reference_id", label: "Reference ID" },
  { key: "payer_name", label: "Payer Name" },
  { key: "payer_email", label: "Payer Email", required: true },
  { key: "gateway_transaction_id", label: "Gateway Transaction ID" },
  { key: "notes", label: "Notes", type: "textarea", className: "col-span-2" },
];

export default function AdminPayments() {
  const { data: payments = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.payments,
    "admin-payments"
  );
  const [viewingPayment, setViewingPayment] = useState<Row | null>(null);
  const [editingPayment, setEditingPayment] = useState<Row | null>(null);

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Payment updated");

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Payments"
        description="View and update payment records."
      />
      <AdminDataList
        rows={payments}
        isLoading={isLoading}
        columns={[
          { key: "payment_type", label: "Type" },
          { key: "payer_name", label: "Payer" },
          { key: "payer_email", label: "Email" },
          {
            key: "amount",
            label: "Amount",
            render: (row) =>
              row.amount ? `${row.currency ?? "SAR"} ${row.amount}` : "—",
          },
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
        onView={setViewingPayment}
        onEdit={setEditingPayment}
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
          deleteRow(String(row.id), `Delete payment from ${row.payer_email}?`)
        }
      />

      <AdminRecordViewDialog
        row={viewingPayment}
        title="Payment"
        titleKey="payer_email"
        fields={FIELDS}
        badges={(row) => (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {String(row.status ?? "pending")}
          </Badge>
        )}
        onOpenChange={(open) => !open && setViewingPayment(null)}
      />
      <AdminRecordEditDialog
        row={editingPayment}
        title="Edit Payment"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingPayment(null)}
      />
    </div>
  );
}
