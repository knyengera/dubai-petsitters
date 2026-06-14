"use server";

import { createClient } from "@/lib/supabase/server";
import {
  parseAdvertisingPlan,
  type AdvertisingPlan,
} from "@/lib/partners/advertising-plans";

export async function getActiveAdvertisingPlans(): Promise<AdvertisingPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("advertising_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(parseAdvertisingPlan);
}
