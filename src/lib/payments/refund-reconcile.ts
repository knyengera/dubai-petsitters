import { createServiceClient, hasServiceRole } from "@/lib/admin/service-client";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";

export async function recordRefundFromWebhook(input: {
  providerPaymentId: string;
  providerRefundId: string;
  amount: number;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasServiceRole()) {
    return { ok: false, error: "Service role not configured" };
  }

  try {
    const supabase = createServiceClient();

    const { data: paymentRow, error: paymentError } = await supabase
      .from("payments")
      .select("id, booking_id, payment_type")
      .eq("provider_payment_id", input.providerPaymentId)
      .maybeSingle();

    if (paymentError || !paymentRow) {
      return { ok: false, error: paymentError?.message ?? "Payment not found for refund" };
    }

    const payment = paymentRow as Record<string, unknown>;
    if (String(payment.payment_type) !== "booking_escrow") {
      return { ok: true };
    }

    const bookingId = payment.booking_id ? String(payment.booking_id) : null;
    if (!bookingId) {
      return { ok: false, error: "Booking not linked to payment" };
    }

    const client = supabase as unknown as {
      rpc(
        name: string,
        params?: Record<string, unknown>
      ): Promise<{ data: unknown; error: { message: string } | null }>;
    };

    const { error } = await client.rpc("monetisation_record_escrow_refund", {
      p_booking_id: bookingId,
      p_amount: input.amount,
      p_provider_refund_id: input.providerRefundId,
      p_reason: input.reason ?? "Gateway refund reconciliation",
      p_metadata: {
        source: "webhook",
        ...(input.metadata ?? {}),
      },
    });

    if (error) {
      if (error.message.includes("exceeds refundable balance")) {
        return { ok: true };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Refund reconciliation failed" };
  }
}

export function parsePaymentRecord(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    payment_type: String(row.payment_type),
    gateway: String(row.gateway),
    payment_provider: row.payment_provider ? String(row.payment_provider) : null,
    amount: Number(row.amount),
    currency: String(row.currency ?? DEFAULT_CURRENCY),
    status: String(row.status),
    reference_id: row.reference_id ? String(row.reference_id) : null,
    booking_id: row.booking_id ? String(row.booking_id) : null,
    payer_name: row.payer_name ? String(row.payer_name) : null,
    payer_email: String(row.payer_email),
    provider_checkout_id: row.provider_checkout_id ? String(row.provider_checkout_id) : null,
    provider_payment_id: row.provider_payment_id ? String(row.provider_payment_id) : null,
    refunded_amount: Number(row.refunded_amount ?? 0),
    provider_payload: (row.provider_payload as Record<string, unknown> | null) ?? null,
  };
}
