"use client";

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { motion } from 'framer-motion';
import { differenceInDays, format, parseISO } from 'date-fns';
import { Syringe, Pill, Stethoscope, AlertTriangle, Bell, ChevronRight, CheckCircle2 } from 'lucide-react';

function urgencyClass(days) {
  if (days <= 3) return { bg: 'bg-red-50 border-red-200', icon: 'text-red-500', badge: 'bg-red-100 text-red-700', label: 'Urgent' };
  if (days <= 7) return { bg: 'bg-orange-50 border-orange-200', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700', label: 'This week' };
  return { bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'Upcoming' };
}

export default function PetRemindersSection({ t }) {
  const today = new Date();

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations-reminders'],
    queryFn: () => entities.Vaccination.list('-date_given', 50),
  });

  const { data: pets = [] } = useQuery({
    queryKey: ['my-pets-reminders'],
    queryFn: () => entities.UserPet.list('-created_date', 20),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments-reminders'],
    queryFn: () => entities.Appointment.filter({ status: 'confirmed' }, 'date', 20),
  });

  const reminders = [];

  // Vaccination reminders (due within 30 days)
  vaccinations.forEach(v => {
    if (!v.next_due_date) return;
    const days = differenceInDays(parseISO(v.next_due_date), today);
    if (days >= 0 && days <= 30) {
      reminders.push({
        id: `vac-${v.id}`,
        type: 'vaccination',
        icon: Syringe,
        title: `${v.vaccine_name} due`,
        subtitle: `${v.pet_name} · ${format(parseISO(v.next_due_date), 'dd MMM yyyy')}`,
        days,
        to: '/pets',
      });
    }
  });

  // Medication reminders — pets with active medications
  pets.forEach(pet => {
    if (pet.medications?.length > 0) {
      reminders.push({
        id: `med-${pet.id}`,
        type: 'medication',
        icon: Pill,
        title: `Medication reminder`,
        subtitle: `${pet.name} · ${pet.medications.join(', ')}`,
        days: 0, // daily recurring
        to: '/pets',
      });
    }
  });

  // Annual checkup reminders — confirmed appointments coming up in 7 days
  appointments.forEach(appt => {
    if (!appt.date) return;
    const days = differenceInDays(parseISO(appt.date), today);
    if (days >= 0 && days <= 7) {
      reminders.push({
        id: `appt-${appt.id}`,
        type: 'checkup',
        icon: Stethoscope,
        title: `Vet appointment: ${appt.type}`,
        subtitle: `${appt.pet_name} · ${appt.clinic_name} · ${format(parseISO(appt.date), 'dd MMM')} at ${appt.time || '–'}`,
        days,
        to: '/my-appointments',
      });
    }
  });

  // Annual checkup nudge — pets with no appointment in past year
  const petNamesWithAppt = new Set(appointments.map(a => a.pet_name?.toLowerCase()));
  pets.forEach(pet => {
    if (!petNamesWithAppt.has(pet.name?.toLowerCase())) {
      reminders.push({
        id: `checkup-${pet.id}`,
        type: 'checkup',
        icon: Stethoscope,
        title: `Annual checkup recommended`,
        subtitle: `${pet.name} hasn't had a confirmed vet visit on record`,
        days: 365,
        to: '/vets',
        soft: true,
      });
    }
  });

  // Sort: urgent first, then soft nudges
  reminders.sort((a, b) => {
    if (a.soft && !b.soft) return 1;
    if (!a.soft && b.soft) return -1;
    return a.days - b.days;
  });

  if (reminders.length === 0) return null;

  const urgent = reminders.filter(r => !r.soft && r.days <= 7).length;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
          <Bell className={`w-5 h-5 ${urgent > 0 ? 'text-orange-500' : 'text-primary'}`} />
          {t ? t('Pet Reminders', 'تذكيرات الحيوانات') : 'Pet Reminders'}
          {urgent > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{urgent}</span>
          )}
        </h2>
        <Link href="/pets" className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
          {t ? t('View pets', 'عرض الحيوانات') : 'View pets'} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Reminder cards */}
      <div className="space-y-2">
        {reminders.slice(0, 6).map((r, i) => {
          const u = r.soft ? { bg: 'bg-slate-50 border-slate-200', icon: 'text-slate-400', badge: 'bg-slate-100 text-slate-600', label: 'Recommended' } : urgencyClass(r.days);
          const Icon = r.icon;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={r.to}>
                <div className={`flex items-center gap-3 border rounded-xl px-4 py-3 hover:shadow-sm transition-all ${u.bg}`}>
                  <div className={`shrink-0 ${u.icon}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">{r.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${u.badge}`}>
                    {r.soft ? u.label : r.days === 0 ? 'Today' : r.days === 1 ? 'Tomorrow' : `${r.days}d`}
                  </span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {reminders.length === 0 && (
        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          All pets are up to date!
        </div>
      )}
    </motion.div>
  );
}