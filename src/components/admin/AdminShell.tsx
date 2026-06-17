"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { ADMIN_NAV_GROUPS, ADMIN_NAV_ITEMS } from "@/lib/admin/config";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <aside className="lg:w-64 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="w-9 h-9 rounded-xl bg-success flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-heading font-bold text-foreground text-sm">
                    Admin Console
                  </p>
                  <Link
                    href="/"
                    className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    View site
                  </Link>
                </div>
              </div>

              <nav className="bg-card border border-border rounded-2xl p-2 space-y-4">
                {ADMIN_NAV_GROUPS.map((group) => {
                  const items = ADMIN_NAV_ITEMS.filter(
                    (item) => item.group === group.id
                  );
                  if (items.length === 0) return null;
                  return (
                    <div key={group.id}>
                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group.label}
                      </p>
                      <ul className="space-y-0.5">
                        {items.map((item) => {
                          const active =
                            pathname === item.href ||
                            (item.href !== "/admin" &&
                              pathname.startsWith(item.href));
                          const Icon = item.icon;
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                className={cn(
                                  "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors",
                                  active
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{item.label}</span>
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
