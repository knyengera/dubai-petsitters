"use client";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES } from "@/lib/admin/tables";

const STATUSES = ["pending", "active", "cancelled", "expired"];

export default function AdminSubscriptions() {
  const { data: subs = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.vet_subscriptions,
    "admin-subscriptions"
  );

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Vet Subscriptions"
        description="Manage vet clinic subscription plans."
      />
      <AdminDataList
        rows={subs}
        isLoading={isLoading}
        columns={[
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
            key: "amount",
            label: "Amount",
            render: (row) => (row.amount ? `SAR ${row.amount}` : "—"),
          },
          { key: "start_date", label: "Start" },
          { key: "end_date", label: "End" },
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
        onDelete={(row) => deleteRow(String(row.id), "Delete subscription?")}
      />
    </div>
  );
}
