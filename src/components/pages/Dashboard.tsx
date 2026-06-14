"use client";

import React from "react";
import Link from "next/link";
import { Loader2, ShieldCheck, LayoutDashboard, ChevronRight } from "lucide-react";
import { base44 } from "@/lib/data";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/config";
import { useHostProfile } from "@/lib/hosting/use-host-profile";
import OwnerDashboard from "@/components/dashboard/OwnerDashboard";
import HostDashboard from "@/components/dashboard/HostDashboard";

export default function Dashboard() {
  const { hostProfile, isHost, isLoading } = useHostProfile();
  const [user, setUser] = React.useState<{ role?: string } | null>(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
        {isHost && hostProfile ? (
          <HostDashboard hostProfile={hostProfile} />
        ) : (
          <OwnerDashboard />
        )}

        {user?.role === "admin" && (
          <div className="bg-success-muted border border-success-border rounded-2xl p-5">
            <h2 className="font-heading text-base font-bold text-foreground flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-success" /> Admin Tools
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/admin">
                <div className="flex items-center gap-3 bg-white dark:bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all sm:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-success flex items-center justify-center shrink-0">
                    <LayoutDashboard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Admin Console</p>
                    <p className="text-xs text-muted-foreground">
                      Platform overview and all management tools
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </div>
              </Link>
              {ADMIN_NAV_ITEMS.filter((item) => item.href !== "/admin")
                .slice(0, 5)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <div className="flex items-center gap-3 bg-white dark:bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
                        <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-success" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
