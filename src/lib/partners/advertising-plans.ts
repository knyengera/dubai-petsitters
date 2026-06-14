export type AdvertisingPlanHighlight = "default" | "featured" | "premium";

export type AdvertisingPlan = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  period_label: string;
  features: string[];
  badge: string | null;
  highlight: AdvertisingPlanHighlight;
  sort_order: number;
  is_active: boolean;
};

export function parseAdvertisingPlan(row: Record<string, unknown>): AdvertisingPlan {
  const features = row.features;
  return {
    id: String(row.id),
    name: String(row.name),
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? "USD"),
    period_label: String(row.period_label ?? "/month"),
    features: Array.isArray(features) ? features.map(String) : [],
    badge: row.badge ? String(row.badge) : null,
    highlight: (row.highlight === "featured" || row.highlight === "premium"
      ? row.highlight
      : "default") as AdvertisingPlanHighlight,
    sort_order: Number(row.sort_order ?? 0),
    is_active: Boolean(row.is_active),
  };
}

export function formatAdvertisingPlanPrice(plan: Pick<AdvertisingPlan, "amount" | "currency">): string {
  const amount = Number(plan.amount);
  const formatted = Number.isFinite(amount)
    ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "0";
  return `${plan.currency} ${formatted}`;
}

export const ADVERTISING_PLAN_HIGHLIGHT_STYLES: Record<AdvertisingPlanHighlight, string> = {
  default: "border-border",
  featured: "border-primary",
  premium: "border-warning",
};
