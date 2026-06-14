import { addMonths, format, parseISO, startOfToday } from "date-fns";
import type { HostBookingCalendar } from "@/lib/monetisation/types";

export function getDefaultCalendarRange() {
  const from = format(startOfToday(), "yyyy-MM-dd");
  const to = format(addMonths(startOfToday(), 6), "yyyy-MM-dd");
  return { from, to };
}

export function calendarToDateSets(calendar: HostBookingCalendar | undefined) {
  const blocked = new Set(calendar?.blocked_dates ?? []);
  const booked = new Set(calendar?.booked_dates ?? []);
  const unavailable = new Set([...blocked, ...booked]);
  return { blocked, booked, unavailable };
}

export function enumerateServiceNights(startDate: string, endDate?: string | null): string[] {
  if (!startDate) return [];
  const start = parseISO(startDate);
  const end = endDate && endDate > startDate ? parseISO(endDate) : start;
  const lastNight = endDate && endDate > startDate
    ? new Date(end.getTime() - 24 * 60 * 60 * 1000)
    : start;

  const nights: string[] = [];
  const cur = new Date(start);
  while (cur <= lastNight) {
    nights.push(format(cur, "yyyy-MM-dd"));
    cur.setDate(cur.getDate() + 1);
  }
  return nights;
}

export function isRangeBookable(
  calendar: HostBookingCalendar | undefined,
  startDate: string,
  endDate?: string | null
): boolean {
  if (!calendar?.host_available || !startDate) return false;
  const { unavailable } = calendarToDateSets(calendar);
  const nights = enumerateServiceNights(startDate, endDate);
  return nights.length > 0 && nights.every((night) => !unavailable.has(night));
}

export function parseCalendarDates(calendar: HostBookingCalendar | undefined) {
  const { blocked, booked } = calendarToDateSets(calendar);
  return {
    blockedDates: [...blocked].map((d) => parseISO(d)),
    bookedDates: [...booked].map((d) => parseISO(d)),
    unavailableDates: [...blocked, ...booked].map((d) => parseISO(d)),
    customPriceDates: (calendar?.custom_prices ?? []).map((item) => parseISO(item.date)),
  };
}
