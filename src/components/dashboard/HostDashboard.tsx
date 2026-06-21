"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/lib/data/entities";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { loadUserConversations } from "@/lib/messaging/conversations";
import { getHostBalance } from "@/lib/monetisation/actions";
import { formatMoney } from "@/lib/monetisation/constants";
import type { HostProfile } from "@/lib/hosting/use-host-profile";
import BookingTimeline from "@/components/host/BookingTimeline";
import HostBookingRequestCard from "@/components/host/HostBookingRequestCard";
import {
  CalendarDays,
  MessageCircle,
  Bell,
  Pencil,
  ChevronRight,
  Star,
  Wallet,
  Clock,
  ExternalLink,
  Settings,
} from "lucide-react";

const quickActions = [
  { icon: CalendarDays, color: "bg-secondary", en: "Manage Calendar", ar: "إدارة التقويم", to: "/host-calendar" },
  { icon: Wallet, color: "bg-primary/80", en: "Earnings", ar: "الأرباح", to: "/host-earnings" },
  { icon: MessageCircle, color: "bg-warning", en: "Messages", ar: "الرسائل", to: "/messages" },
  { icon: Pencil, color: "bg-accent", en: "Edit Listing", ar: "تعديل الإعلان", to: "/host-profile/edit" },
  { icon: Bell, color: "bg-info", en: "Notifications", ar: "الإشعارات", to: "/notifications" },
  { icon: Settings, color: "bg-muted-foreground", en: "Settings", ar: "الإعدادات", to: "/settings" },
];

export default function HostDashboard({ hostProfile }: { hostProfile: NonNullable<HostProfile> }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const hostId = hostProfile.id as string;

  const refreshBookings = () => {
    queryClient.invalidateQueries({ queryKey: ["host-bookings-dashboard", hostId] });
  };

  const { data: bookings = [] } = useQuery({
    queryKey: ["host-bookings-dashboard", hostId],
    queryFn: () => entities.HostingBooking.filter({ host_id: hostId }, "-start_date", 100),
    initialData: [],
  });

  const { data: hostBalance } = useQuery({
    queryKey: ["host-balance-dashboard", hostId],
    queryFn: async () => {
      const result = await getHostBalance(hostId);
      return result.ok ? result.data : null;
    },
  });

  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ["host-unread-messages", user?.email, hostId],
    queryFn: async () => {
      if (!user?.email) return 0;
      const convos = await loadUserConversations({
        email: user.email,
        id: user.id,
      });
      return convos.reduce((sum, conv) => {
        const isOwner = conv.owner_email === user.email;
        return sum + (isOwner ? conv.owner_unread || 0 : conv.contact_unread || 0);
      }, 0);
    },
    enabled: !!user?.email,
  });

  const pendingRequests = bookings.filter(
    (b) => b.status === "pending" && b.payment_status === "unpaid"
  );
  const upcomingCount = bookings.filter(
    (b) => b.status !== "cancelled" && b.status !== "completed"
  ).length;
  const availableBalance = hostBalance?.available_balance ?? 0;
  const services = Array.isArray(hostProfile.services) ? (hostProfile.services as string[]) : [];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-muted-foreground text-sm">{t("Welcome back", "مرحباً بعودتك")}</p>
        <p className="font-heading text-2xl font-bold text-foreground">
          {hostProfile.full_name as string} 👋
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Your hosting hub at a glance", "مركز الاستضافة في لمحة")}
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        {[
          {
            val: pendingRequests.length,
            en: "Pending",
            ar: "معلقة",
            icon: Clock,
            warn: pendingRequests.length > 0,
          },
          { val: upcomingCount, en: "Upcoming", ar: "قادمة", icon: CalendarDays },
          {
            val: formatMoney(availableBalance),
            en: "Available",
            ar: "متاح",
            icon: Wallet,
            to: "/host-earnings",
          },
          {
            val: unreadMessages,
            en: "Messages",
            ar: "رسائل",
            icon: MessageCircle,
            to: "/messages",
            warn: unreadMessages > 0,
          },
        ].map((stat) => {
          const content = (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
                stat.warn ? "bg-warning-muted border-warning-border" : "bg-card border-border"
              }`}
            >
              <stat.icon className={`w-4 h-4 ${stat.warn ? "text-warning" : "text-primary"}`} />
              <span className="font-bold text-foreground text-sm">{stat.val}</span>
              <span className="text-xs text-muted-foreground">{t(stat.en, stat.ar)}</span>
            </div>
          );
          return stat.to ? (
            <Link key={stat.en} href={stat.to}>
              {content}
            </Link>
          ) : (
            <div key={stat.en}>{content}</div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 flex gap-4">
        <div className="w-16 h-16 rounded-xl bg-primary/10 overflow-hidden shrink-0 flex items-center justify-center">
          {hostProfile.photo_url ? (
            <img
              src={hostProfile.photo_url as string}
              alt={hostProfile.full_name as string}
              className="w-full h-full object-cover"
            />
          ) : (
            <CalendarDays className="w-7 h-7 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-heading font-bold text-foreground">{hostProfile.full_name as string}</p>
            {hostProfile.rating != null && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 fill-warning text-warning" />
                {hostProfile.rating as number}
              </span>
            )}
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                hostProfile.is_available
                  ? "bg-success-muted text-success border border-success-border"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {hostProfile.is_available ? t("Active", "نشط") : t("Inactive", "غير نشط")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {[hostProfile.neighborhood, hostProfile.city].filter(Boolean).join(", ")}
          </p>
          {services.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {services.map((s) => s.replace("_", " ")).join(" · ")}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <Link
            href={`/hosts/${hostId}`}
            className="text-primary text-xs font-medium flex items-center gap-1 hover:underline"
          >
            {t("Public profile", "الملف العام")} <ExternalLink className="w-3 h-3" />
          </Link>
          <Link
            href="/host-profile/edit"
            className="text-muted-foreground text-xs font-medium flex items-center gap-1 hover:text-foreground"
          >
            {t("Edit listing", "تعديل الإعلان")} <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div>
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">
          {t("Quick Actions", "إجراءات سريعة")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((a, i) => (
            <motion.div
              key={a.en}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link href={a.to}>
                <div className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all text-center">
                  <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center`}>
                    <a.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[11px] font-medium text-foreground leading-tight">
                    {t(a.en, a.ar)}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-foreground">
              {t("Pending Requests", "طلبات معلقة")}
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((booking) => (
              <HostBookingRequestCard
                key={booking.id}
                booking={booking}
                onUpdated={refreshBookings}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {t("Upcoming Bookings", "الحجوزات القادمة")}
          </h2>
          <Link
            href="/host-calendar"
            className="text-primary text-sm font-medium flex items-center gap-1"
          >
            {t("Manage calendar", "إدارة التقويم")} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <BookingTimeline
            bookings={bookings.filter((b) => b.status !== "pending" || b.payment_status !== "unpaid")}
            perspective="host"
            onUpdated={refreshBookings}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{t("Available balance", "الرصيد المتاح")}</p>
            <p className="font-heading text-2xl font-bold text-foreground mt-1">
              {formatMoney(availableBalance)}
            </p>
            {hostBalance?.pending_balance != null && hostBalance.pending_balance > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {t("Pending", "معلق")}: {formatMoney(hostBalance.pending_balance)}
              </p>
            )}
          </div>
          <Link
            href="/host-earnings"
            className="text-primary text-sm font-medium flex items-center gap-1 shrink-0"
          >
            {t("Earnings & payouts", "الأرباح والمدفوعات")} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
