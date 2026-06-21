import "server-only";
import { createServiceClient } from "@/lib/admin/service-client";
import { getStripeClient } from "@/lib/payments/stripe-client";
import { toStripeAmount } from "@/lib/payments/stripe";
import type { AdvertisingPlan } from "@/lib/partners/advertising-plans";

/**
 * Ensures a Stripe Product + recurring monthly Price exist for an advertising
 * plan, creating them on first use and persisting the ids. Stripe Prices are
 * immutable, so callers should invalidate the stored price when amount/currency
 * change (see syncPlanPrice).
 */
export async function ensurePlanPrice(plan: AdvertisingPlan): Promise<string> {
  if (plan.stripe_price_id) return plan.stripe_price_id;
  return syncPlanPrice(plan);
}

/**
 * Creates a fresh Stripe Product (if needed) and recurring Price for the plan,
 * archives any previous price, and stores the new ids. Returns the price id.
 */
export async function syncPlanPrice(plan: AdvertisingPlan): Promise<string> {
  const stripe = getStripeClient();
  const supabase = createServiceClient();

  let productId = plan.stripe_product_id;
  if (!productId) {
    const product = await stripe.products.create({
      name: `${plan.name} Advertising Plan`,
      metadata: { advertising_plan_id: plan.id },
    });
    productId = product.id;
  }

  const currency = (plan.currency || "USD").toLowerCase();
  const interval = (plan.billing_interval || "month") as "month" | "year";

  const price = await stripe.prices.create({
    product: productId,
    currency,
    unit_amount: toStripeAmount(Number(plan.amount), currency),
    recurring: { interval },
    metadata: { advertising_plan_id: plan.id },
  });

  // Archive the previous price so it can't be reused for new checkouts.
  if (plan.stripe_price_id && plan.stripe_price_id !== price.id) {
    try {
      await stripe.prices.update(plan.stripe_price_id, { active: false });
    } catch {
      // Non-fatal: an already-archived/missing price shouldn't block the sync.
    }
  }

  await supabase
    .from("advertising_plans")
    .update({
      stripe_product_id: productId,
      stripe_price_id: price.id,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", plan.id);

  return price.id;
}
