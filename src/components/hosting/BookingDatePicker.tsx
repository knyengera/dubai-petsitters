"use client";

import { useMemo } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format, parseISO, startOfToday } from "date-fns";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useHostBookingCalendar } from "@/lib/hosting/use-host-booking-calendar";
import { parseCalendarDates } from "@/lib/hosting/availability";

const today = startOfToday();

type BookingDatePickerProps = {
  hostId: string;
  startDate: string;
  endDate: string;
  onRangeChange: (startDate: string, endDate: string) => void;
  disabled?: boolean;
  compact?: boolean;
};

export default function BookingDatePicker({
  hostId,
  startDate,
  endDate,
  onRangeChange,
  disabled = false,
  compact = false,
}: BookingDatePickerProps) {
  const { data: calendar, isLoading, error } = useHostBookingCalendar(hostId, !!hostId);

  const { blockedDates, bookedDates, unavailableDates } = useMemo(
    () => parseCalendarDates(calendar),
    [calendar]
  );

  const selected: DateRange | undefined = useMemo(() => {
    if (!startDate) return undefined;
    return {
      from: parseISO(startDate),
      to: endDate ? parseISO(endDate) : undefined,
    };
  }, [startDate, endDate]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Loading availability...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-destructive bg-destructive/10 rounded-xl p-2">
        Could not load availability calendar.
      </div>
    );
  }

  if (calendar && !calendar.host_available) {
    return (
      <div className="text-xs text-muted-foreground bg-muted rounded-xl p-3">
        This host is not currently accepting bookings.
      </div>
    );
  }

  const handleSelect = (range: DateRange | undefined) => {
    if (!range?.from) {
      onRangeChange("", "");
      return;
    }
    const nextStart = format(range.from, "yyyy-MM-dd");
    const nextEnd = range.to ? format(range.to, "yyyy-MM-dd") : "";
    onRangeChange(nextStart, nextEnd);
  };

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div>
        <Label className="text-xs">Select dates *</Label>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Only available dates can be selected. Greyed-out days are blocked or already booked.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 mb-1">
        {[
          { color: "bg-destructive/20", label: "Blocked" },
          { color: "bg-primary/20", label: "Booked" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 text-[11px]">
            <div className={`w-3 h-3 rounded-full ${item.color}`} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-2 sm:p-3 overflow-x-auto">
        <style>{`
          .booking-date-picker .rdp {
            --rdp-accent-color: hsl(var(--primary));
            --rdp-background-color: hsl(var(--primary) / 0.1);
            margin: 0;
          }
          .booking-date-picker .rdp-day_blocked {
            background-color: color-mix(in srgb, var(--destructive) 20%, transparent) !important;
            color: var(--destructive) !important;
            border-radius: 6px;
            opacity: 0.7;
          }
          .booking-date-picker .rdp-day_booked {
            background-color: color-mix(in srgb, var(--primary) 18%, transparent) !important;
            color: var(--primary) !important;
            border-radius: 6px;
            opacity: 0.7;
          }
          .booking-date-picker .rdp-button {
            width: 100%;
            height: ${compact ? "34px" : "38px"};
            border-radius: 6px;
            font-size: ${compact ? "12px" : "13px"};
          }
          .booking-date-picker .rdp-table { width: 100%; }
          .booking-date-picker .rdp-head_cell,
          .booking-date-picker .rdp-cell { text-align: center; }
        `}</style>
        <div className="booking-date-picker">
          <DayPicker
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            disabled={disabled ? true : [{ before: today }, ...unavailableDates]}
            modifiers={{
              blocked: blockedDates,
              booked: bookedDates,
            }}
            modifiersClassNames={{
              blocked: "rdp-day_blocked",
              booked: "rdp-day_booked",
            }}
            numberOfMonths={compact ? 1 : typeof window !== "undefined" && window.innerWidth >= 640 ? 2 : 1}
            showOutsideDays={false}
          />
        </div>
      </div>

      {startDate && (
        <p className="text-xs text-muted-foreground">
          {endDate && endDate !== startDate
            ? `${format(parseISO(startDate), "MMM d, yyyy")} → ${format(parseISO(endDate), "MMM d, yyyy")}`
            : format(parseISO(startDate), "MMM d, yyyy")}
        </p>
      )}
    </div>
  );
}
