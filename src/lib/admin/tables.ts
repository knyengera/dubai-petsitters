import type { Database } from "@/lib/supabase/database.types";

export type AdminTable = Extract<keyof Database["public"]["Tables"], string>;

export const ADMIN_TABLES = {
  profiles: "profiles",
  pets: "pets",
  pet_hosts: "pet_hosts",
  vet_clinics: "vet_clinics",
  hosting_bookings: "hosting_bookings",
  appointments: "appointments",
  forum_threads: "forum_threads",
  forum_boards: "forum_boards",
  forum_topics: "forum_topics",
  forum_replies: "forum_replies",
  forum_reports: "forum_reports",
  blog_posts: "blog_posts",
  blog_comments: "blog_comments",
  lost_pets: "lost_pets",
  adoption_requests: "adoption_requests",
  payments: "payments",
  platform_fee_settings: "platform_fee_settings",
  escrow_accounts: "escrow_accounts",
  ledger_entries: "ledger_entries",
  host_balances: "host_balances",
  host_payout_requests: "host_payout_requests",
  notification_outbox: "notification_outbox",
  notification_preferences: "notification_preferences",
  partner_deals: "partner_deals",
  partner_inquiries: "partner_inquiries",
  advertising_plans: "advertising_plans",
  vet_subscriptions: "vet_subscriptions",
  reviews: "reviews",
} as const satisfies Record<string, AdminTable>;

export type Row = Record<string, unknown>;

export function parseOrder(order?: string): {
  column: string;
  ascending: boolean;
} {
  if (!order) return { column: "created_at", ascending: false };
  const desc = order.startsWith("-");
  const column = desc ? order.slice(1) : order;
  const mapped =
    column === "created_date"
      ? "created_at"
      : column === "updated_date"
        ? "updated_at"
        : column;
  return { column: mapped, ascending: !desc };
}
