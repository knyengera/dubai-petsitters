"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getIdentityVerificationStatus } from "@/lib/identity/actions";
import type { IdentityVerificationStatus } from "@/lib/identity/constants";

const POLL_INTERVAL_MS = 3000;

type IdentityStatusState = {
  status: IdentityVerificationStatus | null;
  error: string | null;
};

/**
 * Tracks the current user's identity verification status. Uses Supabase
 * Realtime on the profile row as the primary signal, with polling as a fallback
 * for environments where the webhook or realtime channel is delayed.
 */
export function useIdentityStatus(
  userId: string | undefined,
  options?: { enabled?: boolean }
): IdentityStatusState & { refresh: () => Promise<void> } {
  const enabled = options?.enabled ?? true;
  const [status, setStatus] = useState<IdentityVerificationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const result = await getIdentityVerificationStatus();
    setStatus(result.status);
    setError(result.error);
  }, []);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    if (!enabled || !userId) return;

    let cancelled = false;
    void refreshRef.current();

    const supabase = createClient();
    const channel = supabase
      .channel(`identity-status-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as {
            id_verification_status?: IdentityVerificationStatus | null;
            id_verification_error?: string | null;
          };
          if (cancelled) return;
          if (next.id_verification_status !== undefined) {
            setStatus(next.id_verification_status ?? null);
          }
          if (next.id_verification_error !== undefined) {
            setError(next.id_verification_error ?? null);
          }
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      void refreshRef.current();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [enabled, userId]);

  return { status, error, refresh };
}
