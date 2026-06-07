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

const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"];
const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];
const FIELDS: AdminRecordField[] = [
  { key: "host_id", label: "Host ID", viewOnly: true },
  { key: "pet_name", label: "Pet Name", required: true },
  { key: "pet_type", label: "Pet Type", required: true },
  { key: "service_type", label: "Service Type", required: true },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "end_date", label: "End Date", type: "date" },
  { key: "owner_name", label: "Owner Name", required: true },
  { key: "owner_email", label: "Owner Email", required: true },
  { key: "owner_phone", label: "Owner Phone" },
  { key: "city", label: "City" },
  { key: "special_instructions", label: "Special Instructions", type: "textarea", className: "col-span-2" },
  { key: "quoted_price", label: "Quoted Price", type: "number" },
  { key: "platform_fee", label: "Platform Fee", type: "number" },
  { key: "total_price", label: "Total Price", type: "number" },
  { key: "status", label: "Status", type: "select", options: BOOKING_STATUSES },
  { key: "payment_status", label: "Payment Status", type: "select", options: PAYMENT_STATUSES },
];

export default function AdminBookings() {
  const { data: bookings = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.hosting_bookings,
    "admin-bookings",
    "-created_at"
  );
  const [viewingBooking, setViewingBooking] = useState<Row | null>(null);
  const [editingBooking, setEditingBooking] = useState<Row | null>(null);

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Booking updated");

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
        onView={setViewingBooking}
        onEdit={setEditingBooking}
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

      <AdminRecordViewDialog
        row={viewingBooking}
        title="Hosting Booking"
        titleKey="pet_name"
        fields={FIELDS}
        badges={(row) => (
          <>
            <Badge variant="secondary" className="capitalize text-[10px]">
              {String(row.status ?? "pending")}
            </Badge>
            <Badge variant="secondary" className="capitalize text-[10px]">
              {String(row.payment_status ?? "unpaid")}
            </Badge>
          </>
        )}
        onOpenChange={(open) => !open && setViewingBooking(null)}
      />
      <AdminRecordEditDialog
        row={editingBooking}
        title="Edit Hosting Booking"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingBooking(null)}
      />
    </div>
  );
}
