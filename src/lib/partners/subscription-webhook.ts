import "server-only";
import type Stripe from "stripe";
import { createServiceClient } from "@/lib/admin/service-client";
import { getStripeClient } from "@/lib/payments/stripe-client";

const SUBSCRIPTION_EVENTS = new Set<string>([
  "checkout.session.completed",
  "invoice.paid",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

type PartnerSubStatus = "incomplete" | "active" | "past_due" | "canceled";

/**
 * Whether this event should be routed to the partner subscription handler.
 * Note: checkout.session.completed is only ours when mode === "subscription";
 * one-time payments are handled by the existing capture path.
 */
export function isPartnerSubscriptionEvent(event: Stripe.Event): boolean {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.mode === "subscription";
  }
  return SUBSCRIPTION_EVENTS.has(event.type);
}

function mapSubscriptionStatus(status: string): PartnerSubStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "canceled";
    default:
      return "incomplete";
  }
}

function stripeId(ref: string | { id: string } | null | undefined): string | null {
  if (!ref) return null;
  return typeof ref === "string" ? ref : ref.id;
}

export async function handlePartnerSubscriptionEvent(
  event: Stripe.Event
): Promise<boolean> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") return false;
      await onCheckoutCompleted(session);
      return true;
    }
    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = stripeId(
        (invoice as unknown as { subscription?: string | { id: string } | null })
          .subscription
      );
      if (subId) await syncFromSubscriptionId(subId);
      return true;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await syncSubscriptionRecord(sub);
      return true;
    }
    default:
      return false;
  }
}

async function onCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const subscriptionId = stripeId(session.subscription);
  const supabase = createServiceClient();

  // Link the Stripe subscription id to the pending row we created at checkout.
  if (subscriptionId) {
    await supabase
      .from("partner_subscriptions")
      .update({
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("stripe_checkout_session_id", session.id);

    await syncFromSubscriptionId(subscriptionId);
  }
}

async function syncFromSubscriptionId(subscriptionId: string): Promise<void> {
  const stripe = getStripeClient();
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscriptionRecord(sub);
}

async function syncSubscriptionRecord(sub: Stripe.Subscription): Promise<void> {
  const supabase = createServiceClient();
  const status = mapSubscriptionStatus(sub.status);
  const periodEndUnix = (sub as unknown as { current_period_end?: number })
    .current_period_end;
  const currentPeriodEnd = periodEndUnix
    ? new Date(periodEndUnix * 1000).toISOString()
    : null;
  const customerId = stripeId(sub.customer);

  // Match the stored row by subscription id; fall back to the latest pending
  // row for this customer (handles events that arrive before checkout linking).
  let row = await findRow(supabase, "stripe_subscription_id", sub.id);
  if (!row && customerId) {
    const { data } = await supabase
      .from("partner_subscriptions")
      .select("id, inquiry_id")
      .eq("stripe_customer_id", customerId)
      .is("stripe_subscription_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    row = data as { id: string; inquiry_id: string | null } | null;
  }
  if (!row) return;

  await supabase
    .from("partner_subscriptions")
    .update({
      stripe_subscription_id: sub.id,
      status,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: Boolean(sub.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", row.id);

  await syncInquiryStatus(supabase, row.inquiry_id, status);
}

async function findRow(
  supabase: ReturnType<typeof createServiceClient>,
  column: string,
  value: string
): Promise<{ id: string; inquiry_id: string | null } | null> {
  const { data } = await supabase
    .from("partner_subscriptions")
    .select("id, inquiry_id")
    .eq(column, value)
    .maybeSingle();
  return data as { id: string; inquiry_id: string | null } | null;
}

/**
 * Reflects the billing state on the originating inquiry so admins know which
 * listings are paid-for. Actual public listing approval stays admin-driven.
 */
async function syncInquiryStatus(
  supabase: ReturnType<typeof createServiceClient>,
  inquiryId: string | null,
  status: PartnerSubStatus
): Promise<void> {
  if (!inquiryId) return;
  const inquiryStatus =
    status === "active"
      ? "subscribed"
      : status === "canceled"
        ? "cancelled"
        : status === "past_due"
          ? "past_due"
          : null;
  if (!inquiryStatus) return;

  await supabase
    .from("partner_inquiries")
    .update({ status: inquiryStatus, updated_at: new Date().toISOString() } as never)
    .eq("id", inquiryId);
}
