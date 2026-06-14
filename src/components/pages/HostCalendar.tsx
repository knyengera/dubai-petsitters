"use client";

import { base44 } from "@/lib/data";

import { useState, useEffect, useMemo } from 'react';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO, isBefore, startOfToday } from 'date-fns';
import { CalendarX, DollarSign, Loader2, Trash2, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';
import BookingTimeline from '@/components/host/BookingTimeline';
import HostEarningsPanel from '@/components/host/HostEarningsPanel';
import { getHostBalance } from '@/lib/monetisation/actions';
import { DEFAULT_CURRENCY } from '@/lib/monetisation/constants';

const today = startOfToday();

export default function HostCalendar() {
  const [currentUser, setCurrentUser] = useState(null);
  const [hostProfile, setHostProfile] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [selectedDates, setSelectedDates] = useState([]);
  const [mode, setMode] = useState('unavailable'); // 'unavailable' | 'custom_price'
  const [customPrice, setCustomPrice] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);

  useEffect(() => {
    base44.auth.me().then(async (user) => {
      if (!user) { base44.auth.redirectToLogin(); return; }
      setCurrentUser(user);
      const hosts = await entities.PetHost.filter({ created_by: user.email });
      if (hosts.length > 0) setHostProfile(hosts[0]);
      setLoadingUser(false);
    });
  }, []);

  const { data: availability = [], refetch: refetchAvail } = useQuery({
    queryKey: ['host-availability', hostProfile?.id],
    queryFn: () => entities.HostAvailability.filter({ host_id: hostProfile.id }, 'date', 200),
    enabled: !!hostProfile?.id,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['host-bookings', hostProfile?.id],
    queryFn: () => entities.HostingBooking.filter({ host_id: hostProfile.id }, '-start_date', 100),
    enabled: !!hostProfile?.id,
  });

  const { data: hostBalance, refetch: refetchBalance } = useQuery({
    queryKey: ['host-balance', hostProfile?.id],
    queryFn: async () => {
      const result = await getHostBalance(hostProfile.id);
      return result.ok ? result.data : null;
    },
    enabled: !!hostProfile?.id,
  });

  // Build sets for calendar modifiers
  const unavailableDates = useMemo(() =>
    availability.filter(a => a.type === 'unavailable').map(a => parseISO(a.date)), [availability]);

  const customPriceDates = useMemo(() =>
    availability.filter(a => a.type === 'custom_price').map(a => parseISO(a.date)), [availability]);

  const bookedDates = useMemo(() => {
    const dates = [];
    bookings.filter(b => b.status !== 'cancelled').forEach(b => {
      if (!b.start_date) return;
      const start = parseISO(b.start_date);
      const end = b.end_date ? parseISO(b.end_date) : start;
      let cur = new Date(start);
      while (cur <= end) { dates.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
    });
    return dates;
  }, [bookings]);

  const handleSave = async () => {
    if (!selectedDates.length || !hostProfile) return;
    setSaving(true);
    // Remove existing for those dates, then recreate
    for (const date of selectedDates) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existing = availability.find(a => a.date === dateStr);
      if (existing) await entities.HostAvailability.delete(existing.id);
      await entities.HostAvailability.create({
        host_id: hostProfile.id,
        date: dateStr,
        type: mode,
        custom_price: mode === 'custom_price' ? parseFloat(customPrice) || undefined : undefined,
        note: note || undefined,
      });
    }
    setSelectedDates([]);
    setCustomPrice('');
    setNote('');
    setSaving(false);
    refetchAvail();
  };

  const handleClearDates = async () => {
    if (!selectedDates.length) return;
    setSaving(true);
    for (const date of selectedDates) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existing = availability.find(a => a.date === dateStr);
      if (existing) await entities.HostAvailability.delete(existing.id);
    }
    setSelectedDates([]);
    setSaving(false);
    refetchAvail();
  };

  const handleDayClick = (date) => {
    if (isBefore(date, today)) return;
    setSelectedDates(prev => {
      const already = prev.some(d => isSameDay(d, date));
      return already ? prev.filter(d => !isSameDay(d, date)) : [...prev, date];
    });
  };

  if (loadingUser) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!hostProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4">
        <div>
          <CalendarX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-heading text-xl font-bold text-foreground mb-2">No Host Profile Found</h2>
          <p className="text-muted-foreground text-sm">You need a host profile to manage your calendar.</p>
        </div>
      </div>
    );
  }

  const selectedInfo = selectedDates.length > 0 ? selectedDates.map(d => {
    const dateStr = format(d, 'yyyy-MM-dd');
    const existing = availability.find(a => a.date === dateStr);
    return existing;
  }) : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-muted-foreground mb-6">
          Managing availability for <span className="font-semibold text-foreground">{hostProfile.full_name}</span>
        </p>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { color: 'bg-destructive/20', label: 'Unavailable' },
            { color: 'bg-warning-muted', label: 'Custom Price' },
            { color: 'bg-primary/20', label: 'Booked' },
            { color: 'bg-info-muted', label: 'Selected' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2 text-sm">
              <div className={`w-4 h-4 rounded-full ${l.color}`} />
              <span className="text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
              <style>{`
                .rdp { --rdp-accent-color: hsl(var(--primary)); --rdp-background-color: hsl(var(--primary)/0.1); margin: 0; }
                .rdp-day_unavailable { background-color: color-mix(in srgb, var(--destructive) 20%, transparent) !important; color: var(--destructive) !important; border-radius: 6px; }
                .rdp-day_custom_price { background-color: var(--warning-muted) !important; color: var(--warning) !important; border-radius: 6px; }
                .rdp-day_booked { background-color: color-mix(in srgb, var(--primary) 18%, transparent) !important; color: var(--primary) !important; border-radius: 6px; font-weight: 600; }
                .rdp-day_selected_custom { background-color: var(--info-muted) !important; color: var(--info) !important; border-radius: 6px; outline: 2px solid var(--info); }
                .rdp-table { width: 100%; }
                .rdp-head_cell, .rdp-cell { text-align: center; }
                .rdp-button { width: 100%; height: 40px; border-radius: 6px; }
              `}</style>
              <DayPicker
                mode="multiple"
                selected={[]}
                onDayClick={handleDayClick}
                disabled={[{ before: today }]}
                modifiers={{
                  unavailable: unavailableDates,
                  custom_price: customPriceDates,
                  booked: bookedDates,
                  selected_custom: selectedDates,
                }}
                modifiersClassNames={{
                  unavailable: 'rdp-day_unavailable',
                  custom_price: 'rdp-day_custom_price',
                  booked: 'rdp-day_booked',
                  selected_custom: 'rdp-day_selected_custom',
                }}
                numberOfMonths={window.innerWidth >= 768 ? 2 : 1}
                showOutsideDays={false}
              />
            </div>

            {/* Action panel */}
            {selectedDates.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-foreground">{selectedDates.length} date{selectedDates.length > 1 ? 's' : ''} selected</p>
                  <button onClick={() => setSelectedDates([])} className="text-xs text-muted-foreground hover:text-foreground">Clear selection</button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setMode('unavailable')}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${mode === 'unavailable' ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    <CalendarX className="w-4 h-4 inline mr-1" />Block Off
                  </button>
                  <button
                    onClick={() => setMode('custom_price')}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border transition-all ${mode === 'custom_price' ? 'bg-warning-muted border-warning-border text-warning' : 'border-border text-muted-foreground hover:bg-muted'}`}
                  >
                    <DollarSign className="w-4 h-4 inline mr-1" />Custom Price
                  </button>
                </div>

                {mode === 'custom_price' && (
                  <div>
                    <Label className="text-xs">Price per night/day ({DEFAULT_CURRENCY})</Label>
                    <Input type="number" min="0" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder="e.g. 250" className="rounded-xl mt-1" />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Note (optional)</Label>
                  <Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="e.g. National Day holiday pricing" className="rounded-xl mt-1 text-sm" />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={saving || (mode === 'custom_price' && !customPrice)} className="flex-1 rounded-xl font-bold">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save
                  </Button>
                  <Button onClick={handleClearDates} disabled={saving} variant="outline" className="rounded-xl gap-1">
                    <Trash2 className="w-4 h-4" />Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Current settings summary */}
            {availability.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="font-semibold text-foreground mb-3">Current Settings ({availability.length} dates)</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {[...availability].sort((a, b) => a.date.localeCompare(b.date)).map(a => (
                    <div key={a.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={a.type === 'unavailable' ? 'border-destructive/30 text-destructive bg-destructive/10' : 'border-warning-border text-warning bg-warning-muted'}>
                          {format(parseISO(a.date), 'MMM d, yyyy')}
                        </Badge>
                        <span className="text-muted-foreground capitalize text-xs">{a.type === 'custom_price' ? `${DEFAULT_CURRENCY} ${a.custom_price}` : 'Blocked'}</span>
                        {a.note && <span className="text-xs text-muted-foreground italic truncate max-w-32">{a.note}</span>}
                      </div>
                      <button
                        onClick={async () => { await entities.HostAvailability.delete(a.id); refetchAvail(); }}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — Timeline + Earnings */}
          <div className="space-y-5">
            <HostEarningsPanel
              hostId={hostProfile.id}
              balance={hostBalance}
              onUpdated={() => refetchBalance()}
            />
            <button
              onClick={() => setShowTimeline(v => !v)}
              className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-2xl mb-3"
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">Upcoming Bookings</span>
                <Badge>{bookings.filter(b => b.status !== 'cancelled').length}</Badge>
              </div>
              {showTimeline ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {showTimeline && (
              <div className="bg-card border border-border rounded-2xl p-4">
                <BookingTimeline bookings={bookings} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}