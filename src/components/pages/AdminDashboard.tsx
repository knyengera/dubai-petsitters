"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetDashboardStats,
  type AdminActionResult,
} from "@/lib/admin/actions";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/config";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronRight, AlertCircle } from "lucide-react";

const STAT_LABELS: Record<string, string> = {
  profiles: "Users",
  vet_clinics: "Vet Clinics",
  pet_hosts: "Hosts",
  hosting_bookings: "Bookings",
  appointments: "Appointments",
  pets: "Adoption Pets",
  adoption_requests: "Adoption Requests",
  lost_pets: "Lost Pet Reports",
  blog_posts: "Blog Posts",
  blog_comments: "Blog Comments",
  forum_threads: "Forum Threads",
  partner_deals: "Partner Deals",
  vet_subscriptions: "Subscriptions",
  payments: "Payments",
  reviews: "Reviews",
  pending_vets: "Pending Vets",
  pending_adoptions: "Pending Adoptions",
};

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const result: AdminActionResult<Record<string, number>> =
        await adminGetDashboardStats();
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const quickLinks = ADMIN_NAV_ITEMS.filter((item) => item.href !== "/admin");

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Platform Overview"
        description="Monitor activity and jump into management tools."
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-destructive text-sm p-4 border border-destructive/20 rounded-2xl">
          <AlertCircle className="w-4 h-4" />
          {(error as Error).message}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
            {Object.entries(data ?? {})
              .filter(([key]) => STAT_LABELS[key])
              .map(([key, value]) => (
                <Card key={key} className="rounded-2xl">
                  <CardHeader className="pb-1">
                    <CardTitle className="text-xs text-muted-foreground font-normal">
                      {STAT_LABELS[key]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                  </CardContent>
                </Card>
              ))}
          </div>

          <h2 className="font-heading text-lg font-bold text-foreground mb-4">
            Management Areas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md hover:border-primary/30 transition-all flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
