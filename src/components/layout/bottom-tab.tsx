"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PawPrint, Bot, Stethoscope, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const tabs = [
  { labelEn: "Home", labelAr: "الرئيسية", path: "/", icon: Home },
  { labelEn: "Dashboard", labelAr: "لوحتي", path: "/dashboard", icon: LayoutDashboard },
  { labelEn: "AI Chat", labelAr: "ذكاء", path: "/ai-chat", icon: Bot },
  { labelEn: "My Pets", labelAr: "حيواناتي", path: "/pets", icon: PawPrint },
  { labelEn: "Vets", labelAr: "أطباء", path: "/vets", icon: Stethoscope },
];

export default function BottomTab() {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border flex select-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {tabs.map((tab) => {
        const { path, icon: Icon } = tab;
        const active =
          pathname === path ||
          (path !== "/" && pathname.startsWith(path));
        return (
          <Link
            key={path}
            href={path}
            className={`relative flex-1 flex flex-col items-center justify-center min-h-[56px] gap-0.5 transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">
              {t(tab.labelEn, tab.labelAr)}
            </span>
            {active && (
              <span
                className="absolute w-8 h-0.5 bg-primary rounded-full"
                style={{ bottom: "env(safe-area-inset-bottom)" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
