import { createStripeCheckoutSession } from "@/lib/payments/stripe";
import { createPayPalOrder } from "@/lib/payments/paypal";
import { updatePaymentCheckoutId } from "@/lib/payments/capture";
import type { CheckoutResult, PaymentRecord } from "@/lib/payments/types";

export async function createGatewayCheckout(
  payment: PaymentRecord,
  provider: string
): Promise<CheckoutResult> {
  if (provider === "stripe") {
    const { url, sessionId } = await createStripeCheckoutSession(payment, provider);
    await updatePaymentCheckoutId(payment.id, sessionId, provider);
    return { url, checkoutId: sessionId, mode: "redirect" };
  }

  if (provider === "paypal") {
    const { url, orderId } = await createPayPalOrder(payment, provider);
    await updatePaymentCheckoutId(payment.id, orderId, provider);
    return { url, checkoutId: orderId, mode: "redirect" };
  }

  return {
    url: "",
    checkoutId: "",
    mode: "manual",
  };
}

export function isPendingPaymentStatus(status: string): boolean {
  return status === "pending" || status === "requires_payment";
}

export function isCapturedPaymentStatus(status: string): boolean {
  return status === "captured" || status === "completed";
}
