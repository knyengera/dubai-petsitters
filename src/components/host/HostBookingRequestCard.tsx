"use client";

import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { User, PawPrint, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { hostDeclineBooking } from "@/lib/hosting/booking-actions";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";

type BookingRow = {
  id: string;
  pet_name?: string;
  pet_type?: string;
  service_type?: string;
  start_date?: string;
  end_date?: string;
  owner_name?: string;
  total_price?: number;
  payment_status?: string;
  escrow_status?: string;
};

export default function HostBookingRequestCard({
  booking,
  onUpdated,
}: {
  booking: BookingRow;
  onUpdated?: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const start = booking.start_date ? new Date(booking.start_date) : null;
  const end = booking.end_date ? new Date(booking.end_date) : null;
  const nights = start && end ? differenceInDays(end, start) : 1;

  const handleDecline = async () => {
    setLoading(true);
    const result = await hostDeclineBooking(booking.id);
    setLoading(false);
    if (!result.ok) {
      toast({ title: "Could not decline", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Booking declined" });
    onUpdated?.();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="font-semibold text-sm text-foreground">{booking.pet_name}</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-warning-muted text-warning border border-warning-border font-medium">
            Awaiting owner payment
          </span>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {booking.owner_name}
          </span>
          <span className="flex items-center gap-1">
            <PawPrint className="w-3 h-3" />
            {booking.pet_type}
          </span>
          <span className="flex items-center gap-1 capitalize">
            <Clock className="w-3 h-3" />
            {booking.service_type?.replace("_", " ")}
          </span>
        </div>
        {start && (
          <p className="text-xs text-muted-foreground mt-2">
            {format(start, "MMM d")}
            {end ? ` → ${format(end, "MMM d")} (${nights} night${nights !== 1 ? "s" : ""})` : " (1 day)"}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {booking.total_price != null && (
          <p className="text-sm font-bold text-primary">
            {DEFAULT_CURRENCY} {booking.total_price}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10"
          disabled={loading}
          onClick={handleDecline}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Decline"}
        </Button>
      </div>
    </div>
  );
}
