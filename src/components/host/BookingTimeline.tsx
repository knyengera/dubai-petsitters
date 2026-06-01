"use client";

import { Badge } from '@/components/ui/badge';
import { CalendarDays, User, PawPrint, Clock } from 'lucide-react';
import { format, differenceInDays, isPast, isToday } from 'date-fns';

const STATUS_STYLES = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-100 text-red-600 border-red-200',
};

export default function BookingTimeline({ bookings }) {
  const upcoming = [...bookings]
    .filter(b => b.status !== 'cancelled')
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  if (upcoming.length === 0) {
    return (
      <div className="text-center py-10">
        <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No upcoming bookings yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcoming.map((b) => {
        const start = new Date(b.start_date);
        const end = b.end_date ? new Date(b.end_date) : null;
        const nights = end ? differenceInDays(end, start) : 1;
        const isActive = isToday(start) || (end && isPast(start) && !isPast(end));

        return (
          <div key={b.id} className={`flex gap-4 p-4 rounded-xl border ${isActive ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}>
            {/* Date block */}
            <div className="shrink-0 text-center w-12">
              <p className="text-xs font-semibold text-muted-foreground uppercase">{format(start, 'MMM')}</p>
              <p className="text-2xl font-extrabold font-heading text-foreground leading-none">{format(start, 'd')}</p>
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-foreground truncate">{b.pet_name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[b.status] || STATUS_STYLES.pending}`}>{b.status}</span>
                {isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium">Active</span>}
              </div>
              <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><User className="w-3 h-3" />{b.owner_name}</span>
                <span className="flex items-center gap-1"><PawPrint className="w-3 h-3" />{b.pet_type}</span>
                <span className="flex items-center gap-1 capitalize"><Clock className="w-3 h-3" />{b.service_type?.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {format(start, 'MMM d')} {end ? `→ ${format(end, 'MMM d')} (${nights} night${nights !== 1 ? 's' : ''})` : '(1 day)'}
                </p>
                {b.total_price && <p className="text-sm font-bold text-primary">SAR {b.total_price}</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}