export type CheckoutResponse =
  | { mode: "redirect"; url: string; checkoutId?: string }
  | { mode: "manual"; paymentId: string; message?: string }
  | { error: string };

export async function startPaymentCheckout(
  paymentId: string,
  provider: string
): Promise<CheckoutResponse> {
  const res = await fetch("/api/payments/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ paymentId, provider }),
  });

  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    return { error: String(data.error ?? "Checkout failed") };
  }

  if (data.mode === "manual") {
    return {
      mode: "manual",
      paymentId: String(data.paymentId ?? paymentId),
      message: data.message ? String(data.message) : undefined,
    };
  }

  return {
    mode: "redirect",
    url: String(data.url),
    checkoutId: data.checkoutId ? String(data.checkoutId) : undefined,
  };
}

export async function pollPaymentStatus(
  paymentId: string,
  maxAttempts = 15,
  intervalMs = 2000
): Promise<{ captured: boolean; status: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`/api/payments/status/${paymentId}`);
    if (res.ok) {
      const data = (await res.json()) as { captured?: boolean; status?: string };
      if (data.captured) {
        return { captured: true, status: String(data.status ?? "captured") };
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return { captured: false, status: "pending" };
}
