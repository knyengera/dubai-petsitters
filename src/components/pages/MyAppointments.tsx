"use client";

import { base44 } from "@/lib/data";

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, Stethoscope, XCircle, Loader2, AlertCircle, CheckCircle2, Ban } from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { appointmentStatus } from '@/lib/ui/status-styles';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   className: appointmentStatus.pending,   icon: Clock },
  confirmed: { label: 'Confirmed', className: appointmentStatus.confirmed, icon: CheckCircle2 },
  completed: { label: 'Completed', className: appointmentStatus.completed, icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', className: 'bg-muted text-muted-foreground border border-border', icon: Ban },
};

const SERVICE_LABELS = {
  checkup: 'General Checkup', vaccination: 'Vaccination', emergency: 'Emergency',
  consultation: 'Consultation', grooming: 'Grooming', dental: 'Dental Care',
};

export default function MyAppointments() {
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [filter, setFilter] = useState('all');

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['my-appointments', user?.email],
    queryFn: () => entities.Appointment.filter({ owner_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);

  const handleCancel = async () => {
    setCancelling(true);
    await entities.Appointment.update(cancelTarget.id, { status: 'cancelled' });
    queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    setCancelling(false);
    setCancelTarget(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
                ${filter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary hover:text-primary'}`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <CalendarDays className="w-14 h-14 text-muted-foreground/40" />
            <p className="text-muted-foreground">No appointments found.</p>
            <a href="/vets" className="text-primary text-sm font-medium hover:underline">Browse vet clinics →</a>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(apt => {
              const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
              const StatusIcon = cfg.icon;
              const canCancel = apt.status === 'pending' || apt.status === 'confirmed';
              return (
                <div key={apt.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Stethoscope className="w-5 h-5 text-primary" />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-heading font-bold text-foreground text-base">{SERVICE_LABELS[apt.type] || apt.type}</h3>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.className}`}>
                        <StatusIcon className="w-3 h-3" />{cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" /> {apt.clinic_name || 'Vet Clinic'}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {apt.date && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {format(new Date(apt.date), 'dd MMM yyyy')}
                        </span>
                      )}
                      {apt.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {apt.time}
                        </span>
                      )}
                    </div>
                    {apt.pet_name && (
                      <p className="text-xs text-muted-foreground mt-1.5">🐾 Pet: <span className="font-medium text-foreground">{apt.pet_name}</span></p>
                    )}
                    {apt.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{apt.notes}"</p>
                    )}
                  </div>

                  {/* Cancel button */}
                  {canCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive shrink-0"
                      onClick={() => setCancelTarget(apt)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Cancel
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" /> Cancel Appointment?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your {SERVICE_LABELS[cancelTarget?.type]} appointment
              {cancelTarget?.clinic_name ? ` at ${cancelTarget.clinic_name}` : ''}
              {cancelTarget?.date ? ` on ${format(new Date(cancelTarget.date), 'dd MMM yyyy')}` : ''}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}