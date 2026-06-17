"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, Pencil, Trash2, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import { AdminRecordEditDialog } from "@/components/admin/AdminRecordDialogs";
import { useAdminPaginatedList } from "@/components/admin/useAdminPaginatedList";
import { getAdminListConfig } from "@/lib/admin/list-config";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import { BOOKING_FIELDS, BOOKING_STATUSES, PAYMENT_STATUSES } from "@/components/pages/admin/booking-fields";

const LIST_CONFIG = getAdminListConfig(ADMIN_TABLES.hosting_bookings);

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  pending: "warning",
  confirmed: "success",
  completed: "secondary",
  cancelled: "destructive",
};

const PAYMENT_BADGE: Record<string, "success" | "warning" | "secondary"> = {
  paid: "success",
  unpaid: "warning",
  refunded: "secondary",
};

function cap(value: unknown): string {
  const s = String(value ?? "").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export default function AdminBookings() {
  const router = useRouter();
  const {
    rows: bookings,
    total,
    page,
    pageSize,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    isLoading,
    updateRow,
    deleteRow,
  } = useAdminPaginatedList(ADMIN_TABLES.hosting_bookings, "admin-bookings");
  const [editingBooking, setEditingBooking] = useState<Row | null>(null);

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Booking updated");

  return (
    <div className="pb-10">
      <AdminPageHeader title="Hosting Bookings" description={`${total} bookings`} />

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by pet, owner, email, or city..."
        filters={(LIST_CONFIG.filters ?? []).map((f) => ({
          key: f.key,
          value: filters[f.key] ?? "all",
          options: f.options,
          allLabel: "All statuses",
        }))}
        onFilterChange={setFilter}
        total={total}
        page={page}
        pageSize={pageSize}
        resultNoun="bookings"
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
          No bookings yet.
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingRow
              key={String(booking.id)}
              booking={booking}
              onView={() => router.push(`/admin/bookings/${booking.id}`)}
              onEdit={() => setEditingBooking(booking)}
              onStatus={(v) => updateRow(String(booking.id), { status: v }, "Status updated")}
              onPayment={(v) => updateRow(String(booking.id), { payment_status: v }, "Payment updated")}
              onDelete={() => deleteRow(String(booking.id), `Delete booking for ${booking.pet_name}?`)}
            />
          ))}
        </div>
      )}

      <AdminPagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />

      <AdminRecordEditDialog
        row={editingBooking}
        title="Edit Hosting Booking"
        fields={BOOKING_FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingBooking(null)}
      />
    </div>
  );
}

function BookingRow({
  booking,
  onView,
  onEdit,
  onStatus,
  onPayment,
  onDelete,
}: {
  booking: Row;
  onView: () => void;
  onEdit: () => void;
  onStatus: (value: string) => void;
  onPayment: (value: string) => void;
  onDelete: () => void;
}) {
  const status = String(booking.status ?? "pending");
  const paymentStatus = String(booking.payment_status ?? "unpaid");
  const dateRange = [booking.start_date, booking.end_date].filter(Boolean).map(String).join(" → ");
  const service = [cap(booking.service_type), cap(booking.city)].filter(Boolean).join(" · ");

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <CalendarDays className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2 flex-wrap">
          {String(booking.pet_name ?? "Booking")}
          <Badge variant={STATUS_BADGE[status] ?? "secondary"} className="text-[10px] capitalize">
            {status}
          </Badge>
          <Badge variant={PAYMENT_BADGE[paymentStatus] ?? "secondary"} className="text-[10px] capitalize">
            {paymentStatus}
          </Badge>
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {String(booking.owner_name ?? "—")}
          {booking.owner_email ? ` · ${String(booking.owner_email)}` : ""}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {[service, dateRange].filter(Boolean).join(" · ") || "No details"}
          {booking.total_price ? ` · ${DEFAULT_CURRENCY} ${booking.total_price}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Select value={status} onValueChange={onStatus}>
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
        <Select value={paymentStatus} onValueChange={onPayment}>
          <SelectTrigger className="w-28 h-8 rounded-lg text-xs">
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
        <button type="button" onClick={onView} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="View booking">
          <Eye className="w-5 h-5" />
        </button>
        <button type="button" onClick={onEdit} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="Edit booking">
          <Pencil className="w-5 h-5" />
        </button>
        <button type="button" onClick={onDelete} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Delete booking">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
