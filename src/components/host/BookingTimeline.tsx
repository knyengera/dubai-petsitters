"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, User, PawPrint, Clock, MapPin, Loader2 } from "lucide-react";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { bookingStatus } from "@/lib/ui/status-styles";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import { hostMarkBookingComplete } from "@/lib/hosting/booking-actions";

const STATUS_STYLES = {
  ...bookingStatus,
  completed: "bg-muted text-muted-foreground border-border",
};

const ESCROW_LABELS: Record<string, string> = {
  pending_payment: "Awaiting payment",
  held: "In escrow",
  release_pending: "Release pending",
  released: "Paid to you",
  refunded: "Refunded",
  disputed: "Disputed",
  cancelled: "Cancelled",
  none: "",
};

type BookingRow = {
  id: string;
  pet_name?: string;
  pet_type?: string;
  service_type?: string;
  start_date?: string;
  end_date?: string;
  owner_name?: string;
  host_name?: string;
  host_id?: string;
  status?: string;
  total_price?: number;
  escrow_status?: string;
};

type BookingTimelineProps = {
  bookings: BookingRow[];
  perspective?: "host" | "owner";
  onUpdated?: () => void;
};

export default function BookingTimeline({
  bookings,
  perspective = "host",
  onUpdated,
}: BookingTimelineProps) {
  const { toast } = useToast();
  const [completingId, setCompletingId] = useState<string | null>(null);

  const upcoming = [...bookings]
    .filter((b) => b.status !== "cancelled")
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime());

  const handleMarkComplete = async (bookingId: string) => {
    setCompletingId(bookingId);
    const result = await hostMarkBookingComplete(bookingId);
    setCompletingId(null);
    if (!result.ok) {
      toast({ title: "Could not complete booking", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Stay marked complete" });
    onUpdated?.();
  };

  if (upcoming.length === 0) {
    return (
      <div className="text-center py-10">
        <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          {perspective === "owner" ? "No upcoming stays yet." : "No upcoming bookings yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcoming.map((b) => {
        const start = new Date(b.start_date!);
        const end = b.end_date ? new Date(b.end_date) : null;
        const nights = end ? differenceInDays(end, start) : 1;
        const isActive = isToday(start) || (end != null && isPast(start) && !isPast(end));
        const canComplete =
          perspective === "host" &&
          b.status === "confirmed" &&
          end != null &&
          isPast(end);

        return (
          <div
            key={b.id}
            className={`flex gap-4 p-4 rounded-xl border ${
              isActive ? "border-primary/40 bg-primary/5" : "border-border bg-card"
            }`}
          >
            <div className="shrink-0 text-center w-12">
              <p className="text-xs font-semibold text-muted-foreground uppercase">{format(start, "MMM")}</p>
              <p className="text-2xl font-extrabold font-heading text-foreground leading-none">{format(start, "d")}</p>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-foreground truncate">{b.pet_name}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                    STATUS_STYLES[b.status as keyof typeof STATUS_STYLES] || STATUS_STYLES.pending
                  }`}
                >
                  {b.status}
                </span>
                {b.escrow_status && b.escrow_status !== "none" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-warning-muted text-warning border border-warning-border font-medium">
                    {ESCROW_LABELS[b.escrow_status] || b.escrow_status}
                  </span>
                )}
                {isActive && (
                  <Badge className="text-xs bg-primary text-primary-foreground">Active</Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                {perspective === "owner" ? (
                  b.host_id ? (
                    <Link
                      href={`/hosts/${b.host_id}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <MapPin className="w-3 h-3" />
                      {b.host_name || "View host"}
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {b.host_name || "Host"}
                    </span>
                  )
                ) : (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {b.owner_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <PawPrint className="w-3 h-3" />
                  {b.pet_type}
                </span>
                <span className="flex items-center gap-1 capitalize">
                  <Clock className="w-3 h-3" />
                  {b.service_type?.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  {format(start, "MMM d")}{" "}
                  {end
                    ? `→ ${format(end, "MMM d")} (${nights} night${nights !== 1 ? "s" : ""})`
                    : "(1 day)"}
                </p>
                <div className="flex items-center gap-2">
                  {b.total_price != null && (
                    <p className="text-sm font-bold text-primary">
                      {DEFAULT_CURRENCY} {b.total_price}
                    </p>
                  )}
                  {canComplete && (
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-xl h-7 text-xs"
                      disabled={completingId === b.id}
                      onClick={() => handleMarkComplete(b.id)}
                    >
                      {completingId === b.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        "Mark complete"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
