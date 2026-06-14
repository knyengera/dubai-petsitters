"use server";

import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_PAYMENT_PROVIDERS } from "@/lib/monetisation/constants";
import {
  isLivePaymentProvider,
  isPayPalConfigured,
  isPayPalWebhookConfigured,
  isStripeConfigured,
  isStripeWebhookConfigured,
} from "@/lib/payments/config";
import type { EnabledPaymentProvider, PaymentProviderSetting } from "@/lib/payments/types";

function integrationStatus(
  providerId: string,
  integrationMode: "live" | "manual"
): EnabledPaymentProvider["integrationStatus"] {
  if (integrationMode === "manual") return "manual";
  if (providerId === "stripe") {
    if (!isStripeConfigured()) return "not_configured";
    if (!isStripeWebhookConfigured()) return "not_configured";
    return "live";
  }
  if (providerId === "paypal") {
    if (!isPayPalConfigured()) return "not_configured";
    if (!isPayPalWebhookConfigured()) return "not_configured";
    return "live";
  }
  return "manual";
}

function parseProvider(row: Record<string, unknown>): PaymentProviderSetting {
  return {
    provider_id: String(row.provider_id),
    display_name: String(row.display_name),
    currencies: String(row.currencies),
    is_enabled: Boolean(row.is_enabled),
    sort_order: Number(row.sort_order ?? 0),
    integration_mode: row.integration_mode === "live" ? "live" : "manual",
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
    updated_by: row.updated_by ? String(row.updated_by) : null,
  };
}

export async function getEnabledPaymentProviders(): Promise<EnabledPaymentProvider[]> {
  const supabase = await createClient();
  const client = supabase as unknown as {
    rpc(name: string): Promise<{ data: unknown; error: { message: string } | null }>;
  };
  const { data, error } = await client.rpc("get_enabled_payment_providers");
  if (error) {
    return SUPPORTED_PAYMENT_PROVIDERS.filter((p) => p.id !== "manual").map((p, i) => ({
      provider_id: p.id,
      display_name: p.name,
      currencies: p.currencies,
      is_enabled: ["stripe", "paypal", "bank_transfer"].includes(p.id),
      sort_order: i + 1,
      integration_mode: isLivePaymentProvider(p.id) ? "live" : "manual",
      integrationStatus: isLivePaymentProvider(p.id) ? "not_configured" : "manual",
    }));
  }

  return ((data as Record<string, unknown>[]) ?? []).map((row) => {
    const provider = parseProvider(row);
    return {
      ...provider,
      integrationStatus: integrationStatus(provider.provider_id, provider.integration_mode),
    };
  });
}

export async function listAllPaymentProviders(): Promise<EnabledPaymentProvider[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_provider_settings")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((row) => {
    const provider = parseProvider(row);
    return {
      ...provider,
      integrationStatus: integrationStatus(provider.provider_id, provider.integration_mode),
    };
  });
}

export async function isProviderEnabled(providerId: string): Promise<boolean> {
  const supabase = await createClient();
  const client = supabase as unknown as {
    rpc(name: string, params: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
  };
  const { data } = await client.rpc("is_payment_provider_enabled", { p_provider_id: providerId });
  return Boolean(data);
}
