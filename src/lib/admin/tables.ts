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
  blog_posts: "blog_posts",
  blog_comments: "blog_comments",
  lost_pets: "lost_pets",
  adoption_requests: "adoption_requests",
  payments: "payments",
  partner_deals: "partner_deals",
  partner_inquiries: "partner_inquiries",
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
