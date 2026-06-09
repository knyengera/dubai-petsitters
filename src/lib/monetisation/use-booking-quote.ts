"use client";

import { useEffect, useState } from "react";
import { getBookingQuote } from "@/lib/monetisation/actions";
import type { BookingQuote } from "@/lib/monetisation/types";

export function useHostingBookingQuote(input: {
  hostId?: string;
  serviceType?: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}) {
  const [quote, setQuote] = useState<BookingQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!input.enabled || !input.hostId || !input.serviceType || !input.startDate) {
      setQuote(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getBookingQuote({
      hostId: input.hostId,
      serviceType: input.serviceType,
      startDate: input.startDate,
      endDate: input.endDate || null,
    }).then((result) => {
      if (cancelled) return;
      if (result.ok === false) {
        setQuote(null);
        setError(result.error);
      } else {
        setQuote(result.data);
        setError(null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [input.hostId, input.serviceType, input.startDate, input.endDate, input.enabled]);

  return { quote, loading, error };
}
