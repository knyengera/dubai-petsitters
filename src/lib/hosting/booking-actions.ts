"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BookingActionResult =
  | { ok: true; data?: Record<string, unknown> }
  | { ok: false; error: string };

function toError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function hostDeclineBooking(
  bookingId: string
): Promise<BookingActionResult> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
    const { data, error } = await client.rpc("host_decline_booking", {
      p_booking_id: bookingId,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard");
    revalidatePath("/host-calendar");
    return { ok: true, data: data as Record<string, unknown> };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function hostMarkBookingComplete(
  bookingId: string
): Promise<BookingActionResult> {
  try {
    const supabase = await createClient();
    const client = supabase as unknown as {
      rpc: (
        fn: string,
        args: Record<string, unknown>
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
    const { data, error } = await client.rpc("monetisation_mark_booking_completed", {
      p_booking_id: bookingId,
    });
    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard");
    revalidatePath("/host-calendar");
    return { ok: true, data: data as Record<string, unknown> };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}
