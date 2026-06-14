"use client";

import { useQuery } from "@tanstack/react-query";
import { getHostBookingCalendar } from "@/lib/monetisation/actions";
import { getDefaultCalendarRange } from "@/lib/hosting/availability";
import type { HostBookingCalendar } from "@/lib/monetisation/types";

export function useHostBookingCalendar(hostId?: string, enabled = true) {
  const range = getDefaultCalendarRange();

  return useQuery({
    queryKey: ["host-booking-calendar", hostId, range.from, range.to],
    queryFn: async (): Promise<HostBookingCalendar> => {
      const result = await getHostBookingCalendar({
        hostId: hostId!,
        from: range.from,
        to: range.to,
      });
      if (result.ok === false) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: enabled && !!hostId,
    staleTime: 60_000,
  });
}
