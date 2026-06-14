import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/admin/auth";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";

export async function GET(
  _request: Request,
  context: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await context.params;
  const user = await getSessionUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payments")
    .select("id, status, payment_type, payer_email, amount, currency, provider_payment_id")
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const row = data as Record<string, unknown>;
  const payerEmail = String(row.payer_email ?? "");

  if (
    user?.email &&
    payerEmail.toLowerCase() !== user.email.toLowerCase() &&
    row.payment_type !== "partner_advertising"
  ) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const status = String(row.status);
  return NextResponse.json({
    id: String(row.id),
    status,
    captured: isCapturedPaymentStatus(status),
    payment_type: String(row.payment_type),
    amount: Number(row.amount),
    currency: String(row.currency ?? DEFAULT_CURRENCY),
    provider_payment_id: row.provider_payment_id ? String(row.provider_payment_id) : null,
  });
}
