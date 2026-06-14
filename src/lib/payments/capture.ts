import { createServiceClient, hasServiceRole } from "@/lib/admin/service-client";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import { capturePayPalOrder } from "@/lib/payments/paypal";
import type { PaymentRecord } from "@/lib/payments/types";

export async function capturePaymentFromWebhook(input: {
  paymentId: string;
  providerPaymentId: string;
  providerPayload?: Record<string, unknown>;
  paypalOrderId?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!hasServiceRole()) {
    return { ok: false, error: "Service role not configured" };
  }

  try {
    if (input.paypalOrderId) {
      try {
        const captureResult = await capturePayPalOrder(input.paypalOrderId);
        input.providerPayload = { ...(input.providerPayload ?? {}), capture: captureResult };
        const capture = (captureResult.purchase_units as Array<{ payments?: { captures?: Array<{ id?: string }> } }>)?.[0]
          ?.payments?.captures?.[0];
        if (capture?.id) {
          input.providerPaymentId = capture.id;
        }
      } catch (e) {
        console.error("PayPal capture error:", e);
      }
    }

    const supabase = createServiceClient();
    const client = supabase as unknown as {
      rpc(
        name: string,
        params?: Record<string, unknown>
      ): Promise<{ data: unknown; error: { message: string } | null }>;
    };

    const { data, error } = await client.rpc("monetisation_capture_payment", {
      p_payment_id: input.paymentId,
      p_provider_payment_id: input.providerPaymentId,
      p_provider_payload: input.providerPayload ?? {},
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    const payload = data as Record<string, unknown> | null;
    if (payload?.already_captured) {
      return { ok: true };
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Capture failed" };
  }
}

export async function loadPaymentRecord(paymentId: string): Promise<PaymentRecord | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
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
  };
}

export async function updatePaymentCheckoutId(
  paymentId: string,
  checkoutId: string,
  provider: string
): Promise<void> {
  const supabase = createServiceClient();
  await supabase
    .from("payments")
    .update({
      provider_checkout_id: checkoutId,
      payment_provider: provider,
      gateway: provider,
    } as never)
    .eq("id", paymentId);
}
