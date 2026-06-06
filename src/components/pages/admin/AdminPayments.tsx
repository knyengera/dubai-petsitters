"use client";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES } from "@/lib/admin/tables";

const STATUSES = ["pending", "completed", "failed", "refunded"];

export default function AdminPayments() {
  const { data: payments = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.payments,
    "admin-payments"
  );

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
    </div>
  );
}
