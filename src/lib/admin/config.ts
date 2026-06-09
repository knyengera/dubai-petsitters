import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Home,
  Calendar,
  CalendarCheck,
  PawPrint,
  Heart,
  MapPin,
  BookOpen,
  MessageSquare,
  Handshake,
  Mail,
  CreditCard,
  Star,
  Receipt,
  Percent,
  Lock,
  BookOpenCheck,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  group: "overview" | "operations" | "content" | "commerce";
};

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
    description: "Platform stats and quick links",
    group: "overview",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
    description: "Manage profiles and roles",
    group: "operations",
  },
  {
    label: "Vet Clinics",
    href: "/admin/vets",
    icon: Stethoscope,
    description: "Approve and feature clinics",
    group: "operations",
  },
  {
    label: "Hosts",
    href: "/admin/hosts",
    icon: Home,
    description: "Pet host listings",
    group: "operations",
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: Calendar,
    description: "Hosting bookings",
    group: "operations",
  },
  {
    label: "Appointments",
    href: "/admin/appointments",
    icon: CalendarCheck,
    description: "Vet appointments",
    group: "operations",
  },
  {
    label: "Adoption Pets",
    href: "/admin/pets",
    icon: PawPrint,
    description: "Adoption catalog",
    group: "content",
  },
  {
    label: "Adoption Requests",
    href: "/admin/adoption-requests",
    icon: Heart,
    description: "Review applications",
    group: "content",
  },
  {
    label: "Lost Pets",
    href: "/admin/lost-pets",
    icon: MapPin,
    description: "Lost & found reports",
    group: "content",
  },
  {
    label: "Blog",
    href: "/admin/blog",
    icon: BookOpen,
    description: "Publish articles",
    group: "content",
  },
  {
    label: "Forum",
    href: "/admin/forum",
    icon: MessageSquare,
    description: "Moderate topics, replies, reports, and boards",
    group: "content",
  },
  {
    label: "Partner Deals",
    href: "/admin/partners",
    icon: Handshake,
    description: "Partner promotions",
    group: "commerce",
  },
  {
    label: "Partner Inquiries",
    href: "/admin/partner-inquiries",
    icon: Mail,
    description: "Partnership form submissions",
    group: "commerce",
  },
  {
    label: "Subscriptions",
    href: "/admin/subscriptions",
    icon: Receipt,
    description: "Vet subscriptions",
    group: "commerce",
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
    description: "Payment records",
    group: "commerce",
  },
  {
    label: "Platform Fees",
    href: "/admin/fees",
    icon: Percent,
    description: "Guest and host payout fees",
    group: "commerce",
  },
  {
    label: "Escrow",
    href: "/admin/escrow",
    icon: Lock,
    description: "Held funds and releases",
    group: "commerce",
  },
  {
    label: "Payouts",
    href: "/admin/payouts",
    icon: Receipt,
    description: "Host withdrawal requests",
    group: "commerce",
  },
  {
    label: "Ledger",
    href: "/admin/ledger",
    icon: BookOpenCheck,
    description: "Financial audit trail",
    group: "commerce",
  },
  {
    label: "Reviews",
    href: "/admin/reviews",
    icon: Star,
    description: "User reviews",
    group: "commerce",
  },
];

export const ADMIN_NAV_GROUPS = [
  { id: "overview" as const, label: "Overview" },
  { id: "operations" as const, label: "Operations" },
  { id: "content" as const, label: "Content" },
  { id: "commerce" as const, label: "Commerce" },
];

export function getAdminHero(pathname: string): {
  title: string;
  subtitle: string;
} {
  const item = ADMIN_NAV_ITEMS.find((n) => n.href === pathname);
  if (item) {
    return { title: item.label, subtitle: item.description ?? "Admin" };
  }
  return { title: "Admin", subtitle: "Platform management" };
}
