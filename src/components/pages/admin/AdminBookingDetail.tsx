"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  CalendarDays,
  MapPin,
  PawPrint,
  Stethoscope,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminRecordEditDialog } from "@/components/admin/AdminRecordDialogs";
import { adminGet, adminUpdate, adminDelete } from "@/lib/admin/actions";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { useToast } from "@/components/ui/use-toast";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import { BOOKING_FIELDS, BOOKING_STATUSES, PAYMENT_STATUSES } from "@/components/pages/admin/booking-fields";

const STATUS_VARIANTS: Record<string, string> = {
  pending: "bg-warning/10 text-warning ring-warning/20",
  confirmed: "bg-success/10 text-success ring-success/20",
  completed: "bg-muted text-muted-foreground ring-border",
  cancelled: "bg-destructive/10 text-destructive ring-destructive/20",
  unpaid: "bg-warning/10 text-warning ring-warning/20",
  paid: "bg-success/10 text-success ring-success/20",
  refunded: "bg-muted text-muted-foreground ring-border",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ring-1 ring-inset ${
        STATUS_VARIANTS[status] ?? "bg-muted text-muted-foreground ring-border"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function cap(value: unknown): string {
  const s = String(value ?? "").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

function money(value: unknown): string {
  if (value === null || value === undefined || String(value).trim() === "") return "—";
  return `${DEFAULT_CURRENCY} ${value}`;
}

export default function AdminBookingDetail({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["admin-booking", bookingId],
    queryFn: async () => {
      const result = await adminGet(ADMIN_TABLES.hosting_bookings, bookingId);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-booking", bookingId] });
    queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
  };

  const updateField = async (payload: Row, message: string) => {
    const result = await adminUpdate(ADMIN_TABLES.hosting_bookings, bookingId, payload, [
      "/admin/bookings",
      `/admin/bookings/${bookingId}`,
    ]);
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    refresh();
    toast({ title: message });
  };

  const handleEditSave = async (id: string, payload: Row) => {
    const result = await adminUpdate(ADMIN_TABLES.hosting_bookings, id, payload, [
      "/admin/bookings",
      `/admin/bookings/${bookingId}`,
    ]);
    if (result.ok === false) {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
      return false;
    }
    refresh();
    toast({ title: "Booking updated" });
    return true;
  };

  const handleDelete = async () => {
    if (!confirm(`Delete booking for ${booking?.pet_name ?? "this pet"}?`)) return;
    const result = await adminDelete(ADMIN_TABLES.hosting_bookings, bookingId, ["/admin/bookings"]);
    if (result.ok === false) {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Deleted" });
    router.push("/admin/bookings");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Booking not found.{" "}
        <Link href="/admin/bookings" className="text-primary underline">
          Back to Bookings
        </Link>
      </div>
    );
  }

  const status = String(booking.status ?? "pending");
  const paymentStatus = String(booking.payment_status ?? "unpaid");
  const dateRange = [booking.start_date, booking.end_date].filter(Boolean).map(String).join(" → ");

  return (
    <div className="pb-12 max-w-5xl mx-auto">
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Bookings
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <h1 className="font-heading text-2xl font-bold text-foreground truncate">
            {String(booking.pet_name ?? "Booking")}
          </h1>
          <StatusPill status={status} />
          <StatusPill status={paymentStatus} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            aria-label="Delete booking"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Booking status</span>
              <Select value={status} onValueChange={(v) => updateField({ status: v }, "Status updated")}>
                <SelectTrigger className="w-36 h-9 rounded-xl text-sm">
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
                value={paymentStatus}
                onValueChange={(v) => updateField({ payment_status: v }, "Payment updated")}
              >
                <SelectTrigger className="w-32 h-9 rounded-xl text-sm">
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

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
              <Fact icon={Stethoscope} label="Service" value={cap(booking.service_type)} />
              <Fact icon={PawPrint} label="Pet type" value={cap(booking.pet_type)} />
              <Fact icon={CalendarDays} label="Dates" value={dateRange} />
              <Fact icon={MapPin} label="City" value={cap(booking.city)} />
            </div>
          </div>

          {booking.special_instructions ? (
            <div className="px-1">
              <h2 className="font-heading text-sm font-semibold text-foreground mb-2">Special Instructions</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {String(booking.special_instructions)}
              </p>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-heading text-sm font-semibold text-foreground">Owner</h2>
            </div>
            <div className="px-5 py-4 space-y-5">
              <Fact icon={User} label="Name" value={booking.owner_name} />
              <Fact icon={Mail} label="Email" value={booking.owner_email} />
              <Fact icon={Phone} label="Phone" value={booking.owner_phone} />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-heading text-sm font-semibold text-foreground">Payment</h2>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-5">
              <Fact label="Quoted price" value={money(booking.quoted_price)} />
              <Fact label="Platform fee" value={money(booking.platform_fee)} />
              <Fact label="Total" value={money(booking.total_price)} />
              <Fact label="Payment" value={cap(paymentStatus)} />
              <Fact label="Escrow" value={cap(booking.escrow_status)} />
              <Fact label="Release" value={cap(booking.release_status)} />
            </div>
          </div>
        </div>
      </div>

      <AdminRecordEditDialog
        row={editing ? booking : null}
        title="Edit Hosting Booking"
        fields={BOOKING_FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditing(false)}
      />
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: unknown;
}) {
  const display = value === null || value === undefined || String(value).trim() === "" ? "—" : String(value);
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
        {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
        {label}
      </p>
      <p className="text-sm text-foreground break-words">{display}</p>
    </div>
  );
}
