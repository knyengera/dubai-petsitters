"use client";

import React, { useState } from 'react';
import { entities } from '@/lib/data/entities';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, CheckCircle2, Loader2 } from 'lucide-react';

const SERVICE_TYPES = [
  { value: 'checkup', label: 'General Checkup' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'dental', label: 'Dental Care' },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

const today = new Date().toISOString().split('T')[0];

export default function AppointmentBookingModal({ clinic, open, onClose }) {
  const [form, setForm] = useState({
    pet_name: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    type: '',
    date: '',
    time: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await entities.Appointment.create({
      ...form,
      clinic_name: clinic.name,
      status: 'pending',
    });
    setLoading(false);
    setSuccess(true);
  };

  const handleClose = () => {
    setSuccess(false);
    setForm({ pet_name: '', owner_name: '', owner_email: '', owner_phone: '', type: '', date: '', time: '', notes: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            Book Appointment at {clinic?.name}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <CheckCircle2 className="w-16 h-16 text-success" />
            <h3 className="font-heading text-xl font-bold text-foreground">Appointment Requested!</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Your appointment request has been submitted. The clinic will confirm shortly.
            </p>
            <Button onClick={handleClose} className="rounded-xl px-8 mt-2">Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Service type */}
            <div className="space-y-1.5">
              <Label>Service Type *</Label>
              <Select value={form.type} onValueChange={v => set('type', v)} required>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a service..." />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date *</Label>
                <Input
                  type="date"
                  min={today}
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Time *</Label>
                <Select value={form.time} onValueChange={v => set('time', v)} required>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select time..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pet info */}
            <div className="space-y-1.5">
              <Label>Pet Name *</Label>
              <Input
                value={form.pet_name}
                onChange={e => set('pet_name', e.target.value)}
                placeholder="e.g. Max"
                required
                className="rounded-xl"
              />
            </div>

            {/* Owner info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Your Name *</Label>
                <Input
                  value={form.owner_name}
                  onChange={e => set('owner_name', e.target.value)}
                  placeholder="Full name"
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input
                  value={form.owner_phone}
                  onChange={e => set('owner_phone', e.target.value)}
                  placeholder="+966..."
                  required
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input
                type="email"
                value={form.owner_email}
                onChange={e => set('owner_email', e.target.value)}
                placeholder="your@email.com"
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any special instructions or concerns..."
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full rounded-xl h-11 font-bold">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</> : 'Request Appointment'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}