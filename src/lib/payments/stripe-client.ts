import "server-only";
import Stripe from "stripe";
import { getStripeSecretKey } from "@/lib/payments/config";

/** Shared Stripe client for server-side payments + billing operations. */
export function getStripeClient(): Stripe {
  const key = getStripeSecretKey();
  if (!key) throw new Error("Stripe is not configured");
  return new Stripe(key);
}
