"use client";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES } from "@/lib/admin/tables";

const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];

export default function AdminBookings() {
  const { data: bookings = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.hosting_bookings,
    "admin-bookings",
    "-created_at"
  );

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Hosting Bookings"
        description="Review and update pet hosting bookings."
      />
      <AdminDataList
        rows={bookings}
        isLoading={isLoading}
        columns={[
          { key: "pet_name", label: "Pet" },
          { key: "owner_name", label: "Owner" },
          { key: "owner_email", label: "Email" },
          { key: "start_date", label: "Start" },
          { key: "end_date", label: "End" },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <Badge variant="secondary" className="capitalize text-[10px]">
                {String(row.status)}
              </Badge>
            ),
          },
          {
            key: "total_price",
            label: "Total",
            render: (row) =>
              row.total_price ? `SAR ${row.total_price}` : "—",
          },
        ]}
        rowActions={(row) => (
          <div className="flex flex-col gap-2">
            <Select
              value={String(row.status ?? "pending")}
              onValueChange={(v) => updateRow(String(row.id), { status: v }, "Status updated")}
            >
              <SelectTrigger className="w-32 h-8 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOOKING_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(row.payment_status ?? "unpaid")}
              onValueChange={(v) =>
                updateRow(String(row.id), { payment_status: v }, "Payment updated")
              }
            >
              <SelectTrigger className="w-32 h-8 rounded-lg text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        onDelete={(row) =>
          deleteRow(String(row.id), `Delete booking for ${row.pet_name}?`)
        }
      />
    </div>
  );
}
