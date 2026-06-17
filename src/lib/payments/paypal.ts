import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import {
  getPayPalApiBase,
  getPayPalClientId,
  getPayPalClientSecret,
  getPayPalWebhookId,
  getPaymentBaseUrl,
  isPayPalConfigured,
} from "@/lib/payments/config";
import type { PaymentRecord } from "@/lib/payments/types";

type PayPalTokenResponse = { access_token: string };
type PayPalLink = { rel: string; href: string };
type PayPalOrderResponse = { id: string; links?: PayPalLink[] };

async function getPayPalAccessToken(): Promise<string> {
  const clientId = getPayPalClientId();
  const clientSecret = getPayPalClientSecret();
  if (!clientId || !clientSecret) {
    throw new Error("PayPal is not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${text}`);
  }

  const data = (await res.json()) as PayPalTokenResponse;
  return data.access_token;
}

function successPath(payment: PaymentRecord): string {
  if (payment.payment_type === "booking_escrow") {
    return `/payments/booking/success?paymentId=${payment.id}`;
  }
  if (payment.payment_type === "vet_subscription") {
    return `/payments/vet/success?paymentId=${payment.id}`;
  }
  return `/payments/partner/success?paymentId=${payment.id}`;
}

function cancelPath(payment: PaymentRecord): string {
  if (payment.payment_type === "booking_escrow") {
    return `/payments/booking/cancel?paymentId=${payment.id}`;
  }
  if (payment.payment_type === "vet_subscription") {
    return `/payments/vet/cancel?paymentId=${payment.id}`;
  }
  return `/payments/partner/cancel?paymentId=${payment.id}`;
}

export async function createPayPalOrder(
  payment: PaymentRecord,
  provider: string
): Promise<{ url: string; orderId: string }> {
  if (!isPayPalConfigured()) {
    throw new Error("PayPal is not configured");
  }

  const token = await getPayPalAccessToken();
  const baseUrl = getPaymentBaseUrl();
  const currency = payment.currency || DEFAULT_CURRENCY;

  const res = await fetch(`${getPayPalApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: payment.id,
          amount: {
            currency_code: currency,
            value: Number(payment.amount).toFixed(2),
          },
          description: payment.payment_type.replace(/_/g, " "),
          custom_id: payment.id,
        },
      ],
      application_context: {
        return_url: `${baseUrl}${successPath(payment)}`,
        cancel_url: `${baseUrl}${cancelPath(payment)}`,
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal order creation failed: ${text}`);
  }

  const order = (await res.json()) as PayPalOrderResponse;
  const approveLink = order.links?.find((l) => l.rel === "payer-action" || l.rel === "approve");
  if (!approveLink?.href) {
    throw new Error("PayPal did not return an approval URL");
  }

  return { url: approveLink.href, orderId: order.id };
}

export async function capturePayPalOrder(orderId: string): Promise<Record<string, unknown>> {
  const token = await getPayPalAccessToken();
  const res = await fetch(`${getPayPalApiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal capture failed: ${text}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

export async function verifyPayPalWebhook(
  headers: Headers,
  body: string
): Promise<{ verified: boolean; event?: Record<string, unknown> }> {
  const webhookId = getPayPalWebhookId();
  if (!webhookId) {
    return { verified: false };
  }

  const token = await getPayPalAccessToken();
  const res = await fetch(`${getPayPalApiBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  });

  if (!res.ok) {
    return { verified: false };
  }

  const result = (await res.json()) as { verification_status?: string };
  if (result.verification_status !== "SUCCESS") {
    return { verified: false };
  }

  return { verified: true, event: JSON.parse(body) as Record<string, unknown> };
}

export function extractPayPalPaymentId(event: Record<string, unknown>): {
  paymentId: string | null;
  providerPaymentId: string | null;
  orderId: string | null;
} {
  const resource = event.resource as Record<string, unknown> | undefined;
  const eventType = String(event.event_type ?? "");

  if (eventType === "CHECKOUT.ORDER.APPROVED" || eventType === "PAYMENT.CAPTURE.COMPLETED") {
    const customId =
      (resource?.custom_id as string | undefined) ||
      ((resource?.purchase_units as Array<{ custom_id?: string }> | undefined)?.[0]?.custom_id);
    const orderId =
      (resource?.id as string | undefined) ||
      ((resource?.supplementary_data as { related_ids?: { order_id?: string } })?.related_ids?.order_id);
    const captureId = resource?.id as string | undefined;
    return {
      paymentId: customId ?? null,
      providerPaymentId: captureId ?? orderId ?? null,
      orderId: orderId ?? null,
    };
  }

  return { paymentId: null, providerPaymentId: null, orderId: null };
}

export async function refundPayPalCapture(
  captureId: string,
  amount: number | null,
  currency: string
): Promise<{ refundId: string }> {
  if (!isPayPalConfigured()) {
    throw new Error("PayPal is not configured");
  }

  const token = await getPayPalAccessToken();
  const body: Record<string, unknown> = {};
  if (amount != null) {
    body.amount = {
      currency_code: currency,
      value: amount.toFixed(2),
    };
  }

  const res = await fetch(`${getPayPalApiBase()}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal refund failed: ${text}`);
  }

  const result = (await res.json()) as { id?: string };
  if (!result.id) {
    throw new Error("PayPal did not return a refund ID");
  }

  return { refundId: result.id };
}

export function extractPayPalRefundDetails(event: Record<string, unknown>): {
  providerRefundId: string | null;
  providerPaymentId: string | null;
  amount: number | null;
  currency: string | null;
} {
  const eventType = String(event.event_type ?? "");
  if (eventType !== "PAYMENT.CAPTURE.REFUNDED") {
    return { providerRefundId: null, providerPaymentId: null, amount: null, currency: null };
  }

  const resource = event.resource as Record<string, unknown> | undefined;
  const amountObj = resource?.amount as { value?: string; currency_code?: string } | undefined;
  const links = resource?.links as Array<{ rel?: string; href?: string }> | undefined;
  const captureLink = links?.find((l) => l.rel === "up");
  const captureId = captureLink?.href?.split("/").pop() ?? null;

  return {
    providerRefundId: (resource?.id as string | undefined) ?? null,
    providerPaymentId: captureId,
    amount: amountObj?.value ? parseFloat(amountObj.value) : null,
    currency: amountObj?.currency_code?.toUpperCase() ?? null,
  };
}
