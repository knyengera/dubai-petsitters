import type { LucideIcon } from "lucide-react";
import {
  Home,
  PawPrint,
  Stethoscope,
  LayoutDashboard,
  Heart,
  MapPin,
} from "lucide-react";
import { isProtectedPath } from "@/lib/auth/routes";

export type NavLinkItem = {
  labelEn: string;
  labelAr: string;
  path: string;
};

export type BottomTabItem = NavLinkItem & {
  icon: LucideIcon;
};

/** Public routes shown to everyone (listed first). */
export const PUBLIC_NAV_LINKS: NavLinkItem[] = [
  { labelEn: "Find a Vet", labelAr: "ابحث عن طبيب", path: "/vets" },
  { labelEn: "Adopt", labelAr: "تبني", path: "/adopt" },
  { labelEn: "Pet Hosting", labelAr: "استضافة", path: "/hosting" },
  { labelEn: "Blog", labelAr: "المدونة", path: "/blog" },
  { labelEn: "Forum", labelAr: "المنتدى", path: "/forum" },
];

/** Account routes — only when authenticated (listed after public). */
export const PROTECTED_NAV_LINKS: NavLinkItem[] = [
  { labelEn: "Dashboard", labelAr: "لوحة التحكم", path: "/dashboard" },
  { labelEn: "My Pets", labelAr: "حيواناتي", path: "/pets" },
];

export const PROTECTED_EXTRA_NAV_LINKS: NavLinkItem[] = [
  { labelEn: "Messages", labelAr: "الرسائل", path: "/messages" },
];

export const ADMIN_NAV_LINK: NavLinkItem = {
  labelEn: "Admin",
  labelAr: "الإدارة",
  path: "/admin",
};

export function getHeaderNavLinks(isAuthenticated: boolean): NavLinkItem[] {
  if (!isAuthenticated) return [...PUBLIC_NAV_LINKS];
  return [...PUBLIC_NAV_LINKS, ...PROTECTED_NAV_LINKS];
}

const PUBLIC_BOTTOM_TABS: BottomTabItem[] = [
  { labelEn: "Home", labelAr: "الرئيسية", path: "/", icon: Home },
  { labelEn: "Vets", labelAr: "أطباء", path: "/vets", icon: Stethoscope },
  { labelEn: "Adopt", labelAr: "تبني", path: "/adopt", icon: Heart },
  { labelEn: "Hosting", labelAr: "استضافة", path: "/hosting", icon: MapPin },
];

const PROTECTED_BOTTOM_TABS: BottomTabItem[] = [
  { labelEn: "Dashboard", labelAr: "لوحتي", path: "/dashboard", icon: LayoutDashboard },
  { labelEn: "My Pets", labelAr: "حيواناتي", path: "/pets", icon: PawPrint },
];

export function getBottomTabs(isAuthenticated: boolean): BottomTabItem[] {
  if (!isAuthenticated) return [...PUBLIC_BOTTOM_TABS];
  return [
    PUBLIC_BOTTOM_TABS[0],
    PUBLIC_BOTTOM_TABS[1],
    ...PROTECTED_BOTTOM_TABS,
  ];
}

/** Paths that use the main shell header (no sub-page top bar on mobile). */
export function getMainTabPaths(isAuthenticated: boolean): string[] {
  return getBottomTabs(isAuthenticated).map((tab) => tab.path);
}

export function isNavPathVisible(path: string, isAuthenticated: boolean): boolean {
  if (!isProtectedPath(path)) return true;
  return isAuthenticated;
}

export function filterByAuth<T extends { path?: string; to?: string }>(
  items: T[],
  isAuthenticated: boolean,
  pathKey: "path" | "to" = "path"
): T[] {
  return items.filter((item) => {
    const href = item[pathKey];
    if (!href) return true;
    return isNavPathVisible(href, isAuthenticated);
  });
}
