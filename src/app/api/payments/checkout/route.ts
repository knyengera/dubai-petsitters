import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/admin/auth";
import { isLivePaymentProvider } from "@/lib/payments/config";
import { createGatewayCheckout, isPendingPaymentStatus } from "@/lib/payments/checkout";
import { isProviderEnabled } from "@/lib/payments/providers";
import type { PaymentRecord } from "@/lib/payments/types";

function parsePayment(row: Record<string, unknown>): PaymentRecord {
  return {
    id: String(row.id),
    payment_type: String(row.payment_type),
    gateway: String(row.gateway),
    payment_provider: row.payment_provider ? String(row.payment_provider) : null,
    amount: Number(row.amount),
    currency: String(row.currency ?? "SAR"),
    status: String(row.status),
    reference_id: row.reference_id ? String(row.reference_id) : null,
    booking_id: row.booking_id ? String(row.booking_id) : null,
    payer_name: row.payer_name ? String(row.payer_name) : null,
    payer_email: String(row.payer_email),
    provider_checkout_id: row.provider_checkout_id ? String(row.provider_checkout_id) : null,
  };
}

async function canAccessPayment(payment: PaymentRecord, userEmail?: string | null): Promise<boolean> {
  if (!userEmail) {
    return payment.payment_type === "partner_advertising";
  }
  return payment.payer_email.toLowerCase() === userEmail.toLowerCase();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { paymentId?: string; provider?: string };
    const paymentId = body.paymentId?.trim();
    const provider = body.provider?.trim();

    if (!paymentId || !provider) {
      return NextResponse.json({ error: "paymentId and provider are required" }, { status: 400 });
    }

    const enabled = await isProviderEnabled(provider);
    if (!enabled) {
      return NextResponse.json({ error: "Payment provider is not enabled" }, { status: 400 });
    }

    const user = await getSessionUser();
    const supabase = await createClient();
    const { data, error } = await supabase.from("payments").select("*").eq("id", paymentId).maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const payment = parsePayment(data as Record<string, unknown>);

    if (!(await canAccessPayment(payment, user?.email))) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    if (!isPendingPaymentStatus(payment.status)) {
      return NextResponse.json({ error: "Payment is not pending" }, { status: 400 });
    }

    if (!isLivePaymentProvider(provider)) {
      return NextResponse.json({
        mode: "manual",
        paymentId: payment.id,
        message: "Manual payment selected. Awaiting admin confirmation.",
      });
    }

    const checkout = await createGatewayCheckout(payment, provider);
    return NextResponse.json({ url: checkout.url, checkoutId: checkout.checkoutId, mode: "redirect" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
