"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/lib/data";
import { entities } from "@/lib/data/entities";
import { useLanguage } from "@/lib/language-context";
import {
  PawPrint,
  Calendar,
  Bot,
  Stethoscope,
  Plus,
  ChevronRight,
  Syringe,
  MessageCircle,
  MapPin,
} from "lucide-react";
import PetRemindersSection from "@/components/home/PetRemindersSection";
import { usePetHealthAssistant } from "@/lib/pet-health-assistant-context";
import BookingTimeline from "@/components/host/BookingTimeline";

const quickActions = [
  { icon: Bot, color: "bg-primary", en: "AI Pet Care", ar: "رعاية ذكية", openAssistant: true as const },
  { icon: PawPrint, color: "bg-accent", en: "My Pets", ar: "حيواناتي", to: "/pets" },
  { icon: Calendar, color: "bg-info", en: "Book Appointment", ar: "احجز موعداً", to: "/appointments" },
  { icon: Stethoscope, color: "bg-success", en: "Find a Vet", ar: "ابحث عن طبيب", to: "/vets" },
  { icon: MessageCircle, color: "bg-warning", en: "Messages", ar: "الرسائل", to: "/messages" },
];

export default function OwnerDashboard() {
  const { t } = useLanguage();
  const { openAssistant } = usePetHealthAssistant();
  const [user, setUser] = React.useState<{ full_name?: string; email?: string } | null>(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: pets = [] } = useQuery({
    queryKey: ["my-pets"],
    queryFn: () => entities.UserPet.list("-created_date", 10),
    initialData: [],
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["my-appointments"],
    queryFn: () => entities.Appointment.filter({ status: "pending" }, "date", 5),
    initialData: [],
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["vaccinations"],
    queryFn: () => entities.Vaccination.list("-date_given", 10),
    initialData: [],
  });

  const { data: hostingBookings = [] } = useQuery({
    queryKey: ["my-hosting-bookings", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const bookings = await entities.HostingBooking.filter(
        { owner_email: user.email },
        "-start_date",
        10
      );
      const hostIds = [...new Set(bookings.map((b) => b.host_id).filter(Boolean))] as string[];
      const hosts = await Promise.all(hostIds.map((id) => entities.PetHost.get(id)));
      const hostMap = new Map(hosts.filter(Boolean).map((h) => [h!.id, h!.full_name as string]));
      return bookings.map((b) => ({
        ...b,
        host_name: b.host_id ? hostMap.get(b.host_id as string) : undefined,
      }));
    },
    enabled: !!user?.email,
    initialData: [],
  });

  const dueSoon = vaccinations.filter((v) => {
    if (!v.next_due_date) return false;
    const due = new Date(v.next_due_date);
    const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
  });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-muted-foreground text-sm">{t("Welcome back", "مرحباً بعودتك")}</p>
        <p className="font-heading text-2xl font-bold text-foreground">
          {user?.full_name || t("Pet Owner", "صاحب الحيوان")} 👋
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {t("Your pet care hub at a glance", "مركز رعاية حيوانك في لمحة")}
        </p>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        {[
          { val: pets.length, en: "Pets", ar: "حيوانات", icon: PawPrint, to: "/pets" },
          { val: appointments.length, en: "Upcoming", ar: "قادمة", icon: Calendar, to: "/appointments" },
          {
            val: dueSoon.length,
            en: "Vaccines Due",
            ar: "تطعيمات",
            icon: Syringe,
            to: "/pets",
            warn: dueSoon.length > 0,
          },
        ].map((stat) => (
          <Link key={stat.en} href={stat.to}>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
                stat.warn ? "bg-warning-muted border-warning-border" : "bg-card border-border"
              }`}
            >
              <stat.icon className={`w-4 h-4 ${stat.warn ? "text-warning" : "text-primary"}`} />
              <span className="font-bold text-foreground">{stat.val}</span>
              <span className="text-xs text-muted-foreground">{t(stat.en, stat.ar)}</span>
            </div>
          </Link>
        ))}
      </div>

      <PetRemindersSection t={t} />

      <div>
        <h2 className="font-heading text-lg font-bold text-foreground mb-4">
          {t("Quick Actions", "إجراءات سريعة")}
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {quickActions.map((a, i) => {
            const card = (
              <div className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all text-center">
                <div className={`w-10 h-10 rounded-xl ${a.color} flex items-center justify-center`}>
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-[11px] font-medium text-foreground leading-tight">
                  {t(a.en, a.ar)}
                </span>
              </div>
            );
            return (
              <motion.div
                key={a.en}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
              >
                {"openAssistant" in a && a.openAssistant ? (
                  <button type="button" onClick={openAssistant} className="w-full text-start">
                    {card}
                  </button>
                ) : (
                  <Link href={a.to!}>{card}</Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-foreground">{t("My Pets", "حيواناتي")}</h2>
          <Link href="/pets" className="text-primary text-sm font-medium flex items-center gap-1">
            {t("Manage", "إدارة")} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {pets.length === 0 ? (
          <Link href="/pets">
            <div className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center text-center hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <p className="font-semibold text-foreground">
                {t("Add Your First Pet", "أضف حيوانك الأول")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t("Start tracking health & vaccinations", "ابدأ بتتبع الصحة والتطعيمات")}
              </p>
            </div>
          </Link>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {pets.map((pet) => (
              <Link key={pet.id} href="/pets">
                <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                    {pet.photo_url ? (
                      <img
                        src={pet.photo_url}
                        alt={pet.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <PawPrint className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <p className="font-semibold text-foreground text-sm">{pet.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {pet.species} · {pet.breed || t("Mixed", "هجين")}
                  </p>
                </div>
              </Link>
            ))}
            <Link href="/pets">
              <div className="bg-muted rounded-2xl p-4 flex flex-col items-center justify-center min-h-[100px] hover:bg-muted/80 transition-colors border-2 border-dashed border-border">
                <Plus className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground mt-1">{t("Add pet", "أضف حيوانًا")}</span>
              </div>
            </Link>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {t("Upcoming Appointments", "المواعيد القادمة")}
          </h2>
          <Link href="/appointments" className="text-primary text-sm font-medium flex items-center gap-1">
            {t("View all", "عرض الكل")} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {appointments.length === 0 ? (
          <Link href="/appointments">
            <div className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
              <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {t("No upcoming appointments. Book one now.", "لا توجد مواعيد قادمة. احجز الآن.")}
              </p>
            </div>
          </Link>
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 3).map((appt) => (
              <div
                key={appt.id}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-info-muted rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-info" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">
                    {appt.pet_name} – {appt.type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appt.clinic_name} · {appt.date}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full capitalize">
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-foreground">
            {t("My Stays", "إقاماتي")}
          </h2>
          <Link href="/hosting" className="text-primary text-sm font-medium flex items-center gap-1">
            {t("Find a host", "ابحث عن مضيف")} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {hostingBookings.length === 0 ? (
          <Link href="/hosting">
            <div className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-md transition-shadow">
              <MapPin className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {t("No upcoming stays. Browse pet hosts.", "لا توجد إقامات قادمة. تصفح مضيفي الحيوانات.")}
              </p>
            </div>
          </Link>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-4">
            <BookingTimeline bookings={hostingBookings.slice(0, 5)} perspective="owner" />
          </div>
        )}
      </div>
    </div>
  );
}
