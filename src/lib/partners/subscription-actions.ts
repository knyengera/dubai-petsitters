"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/admin/service-client";
import { getSessionUser, requireAdmin } from "@/lib/admin/auth";
import { getStripeClient } from "@/lib/payments/stripe-client";
import { getPaymentBaseUrl, isStripeConfigured } from "@/lib/payments/config";
import { ensurePlanPrice } from "@/lib/partners/stripe-plan-sync";
import { parseAdvertisingPlan } from "@/lib/partners/advertising-plans";
import { getPartnerBillingEnabled } from "@/lib/partners/billing-settings";
import { createClient } from "@/lib/supabase/server";

export type SubscriptionActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type PartnerAdvertisingSettingsRow = {
  id: string;
  billing_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
};

function toError(e: unknown): string {
  return e instanceof Error ? e.message : "Unknown error";
}

/**
 * Finds an existing Stripe customer by email or creates one. Recurring billing
 * needs a persistent customer so renewals and the portal work.
 */
async function findOrCreateCustomer(
  email: string,
  name?: string | null
): Promise<string> {
  const stripe = getStripeClient();
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data[0]) return existing.data[0].id;
  const created = await stripe.customers.create({
    email,
    name: name || undefined,
  });
  return created.id;
}

/**
 * Starts a Stripe subscription Checkout for a partner advertising plan and
 * records a pending partner_subscriptions row. Returns the hosted Checkout URL.
 */
export async function createPartnerSubscriptionCheckout(input: {
  inquiryId: string;
  planId: string;
  payerName: string;
  payerEmail: string;
}): Promise<SubscriptionActionResult<{ url: string }>> {
  try {
    if (!isStripeConfigured()) {
      return { ok: false, error: "Stripe is not configured." };
    }
    if (!(await getPartnerBillingEnabled())) {
      return { ok: false, error: "Advertising billing is currently disabled." };
    }
    const email = input.payerEmail.trim().toLowerCase();
    if (!email) return { ok: false, error: "A billing email is required." };

    const supabase = createServiceClient();
    const { data: planRow, error: planError } = await supabase
      .from("advertising_plans")
      .select("*")
      .eq("id", input.planId)
      .maybeSingle();

    if (planError) return { ok: false, error: planError.message };
    if (!planRow) return { ok: false, error: "Advertising plan not found." };

    const plan = parseAdvertisingPlan(planRow as Record<string, unknown>);
    const priceId = await ensurePlanPrice(plan);
    const customerId = await findOrCreateCustomer(email, input.payerName);

    const user = await getSessionUser();
    const baseUrl = getPaymentBaseUrl();
    const stripe = getStripeClient();

    const metadata = {
      inquiry_id: input.inquiryId,
      plan_id: input.planId,
      payer_email: email,
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: input.inquiryId,
      // Let Stripe pick eligible payment methods dynamically.
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata },
      metadata,
      success_url: `${baseUrl}/payments/partner/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payments/partner/cancel`,
    });

    if (!session.url) {
      return { ok: false, error: "Stripe did not return a checkout URL." };
    }

    const { error: insertError } = await supabase
      .from("partner_subscriptions")
      .insert({
        inquiry_id: input.inquiryId,
        plan_id: input.planId,
        plan_name: plan.name,
        payer_name: input.payerName,
        payer_email: email,
        user_id: user?.id ?? null,
        stripe_customer_id: customerId,
        stripe_checkout_session_id: session.id,
        status: "incomplete",
        currency: plan.currency,
        amount: plan.amount,
      } as never);

    if (insertError) return { ok: false, error: insertError.message };

    return { ok: true, data: { url: session.url } };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

/**
 * Returns a Stripe Customer Portal URL so a partner can update payment details
 * or cancel. Restricted to the authenticated partner whose email matches the
 * subscription on file.
 */
export async function createPartnerBillingPortalSession(): Promise<
  SubscriptionActionResult<{ url: string }>
> {
  try {
    if (!isStripeConfigured()) {
      return { ok: false, error: "Stripe is not configured." };
    }
    const user = await getSessionUser();
    if (!user?.email) {
      return { ok: false, error: "Please sign in to manage your subscription." };
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("partner_subscriptions")
      .select("stripe_customer_id")
      .eq("payer_email", user.email.toLowerCase())
      .not("stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    const row = data as { stripe_customer_id: string | null } | null;
    if (!row?.stripe_customer_id) {
      return { ok: false, error: "No subscription found for your account." };
    }

    const stripe = getStripeClient();
    const portal = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: `${getPaymentBaseUrl()}/become-partner`,
    });

    return { ok: true, data: { url: portal.url } };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export type AdminPartnerSubscriptionList = {
  rows: Record<string, unknown>[];
  total: number;
};

export async function adminListPartnerSubscriptions(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
}): Promise<SubscriptionActionResult<AdminPartnerSubscriptionList>> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const page = Math.max(1, params?.page ?? 1);
    const pageSize = Math.max(1, params?.pageSize ?? 20);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("partner_subscriptions")
      .select("*", { count: "exact" });
    if (params?.status && params.status !== "all") {
      query = query.eq("status", params.status);
    }
    const search = (params?.search ?? "").trim().replace(/[%,()]/g, " ").trim();
    if (search) query = query.ilike("payer_email", `%${search}%`);

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) return { ok: false, error: error.message };

    return {
      ok: true,
      data: { rows: (data ?? []) as Record<string, unknown>[], total: count ?? 0 },
    };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

/**
 * Admin-initiated cancellation. Defaults to cancel-at-period-end so the partner
 * keeps access until the paid period lapses; the webhook syncs the final state.
 */
export async function adminCancelPartnerSubscription(input: {
  subscriptionId: string;
  immediately?: boolean;
}): Promise<SubscriptionActionResult> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("partner_subscriptions")
      .select("stripe_subscription_id")
      .eq("id", input.subscriptionId)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    const row = data as { stripe_subscription_id: string | null } | null;
    if (!row?.stripe_subscription_id) {
      return { ok: false, error: "Subscription has no Stripe reference yet." };
    }

    const stripe = getStripeClient();
    if (input.immediately) {
      await stripe.subscriptions.cancel(row.stripe_subscription_id);
    } else {
      await stripe.subscriptions.update(row.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      await supabase
        .from("partner_subscriptions")
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", input.subscriptionId);
    }

    revalidatePath("/admin/subscriptions");
    return { ok: true, data: undefined };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminGetPartnerBillingSettings(): Promise<
  SubscriptionActionResult<PartnerAdvertisingSettingsRow>
> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("partner_advertising_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Advertising settings not found" };
    return { ok: true, data: data as PartnerAdvertisingSettingsRow };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminUpdatePartnerBillingSettings(input: {
  billingEnabled: boolean;
}): Promise<SubscriptionActionResult<PartnerAdvertisingSettingsRow>> {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();

    const updates: Record<string, unknown> = {
      billing_enabled: input.billingEnabled,
      updated_at: new Date().toISOString(),
      updated_by: admin.email,
    };

    const { data: existing, error: existingError } = await supabase
      .from("partner_advertising_settings")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (existingError) return { ok: false, error: existingError.message };

    const existingRow = existing as { id: string } | null;

    let data: PartnerAdvertisingSettingsRow | null = null;
    let error: { message: string } | null = null;

    if (existingRow?.id) {
      const result = await supabase
        .from("partner_advertising_settings")
        .update(updates as never)
        .eq("id", existingRow.id)
        .select()
        .single();
      data = result.data as PartnerAdvertisingSettingsRow | null;
      error = result.error;
    } else {
      const result = await supabase
        .from("partner_advertising_settings")
        .insert(updates as never)
        .select()
        .single();
      data = result.data as PartnerAdvertisingSettingsRow | null;
      error = result.error;
    }

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/advertising-plans");
    return { ok: true, data: data as PartnerAdvertisingSettingsRow };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}
