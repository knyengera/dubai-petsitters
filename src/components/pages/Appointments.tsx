"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/lib/data';
import { useLanguage } from '@/lib/language-context';
import { Calendar, Plus, X, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const TYPES = ['checkup', 'vaccination', 'emergency', 'consultation', 'grooming', 'dental'];
const STATUSES = { pending: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20', confirmed: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', completed: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20', cancelled: 'text-red-500 bg-red-50 dark:bg-red-900/20' };

const emptyForm = { pet_name: '', clinic_name: '', vet_name: '', date: '', time: '', type: '', owner_name: '', owner_email: '', owner_phone: '', notes: '' };

export default function Appointments() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(u => u && setForm(f => ({ ...f, owner_email: u.email, owner_name: u.full_name }))).catch(() => {});
  }, []);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['my-appointments-all'],
    queryFn: () => base44.entities.Appointment.list('-date', 50),
    initialData: [],
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    await base44.entities.Appointment.create(form);
    toast({ title: t('Appointment booked!', 'تم حجز الموعد!') });
    qc.invalidateQueries(['my-appointments-all']);
    qc.invalidateQueries(['my-appointments']);
    setForm(emptyForm);
    setShowForm(false);
    setLoading(false);
  };

  const upcoming = appointments.filter(a => a.status !== 'completed' && a.status !== 'cancelled');
  const past = appointments.filter(a => a.status === 'completed' || a.status === 'cancelled');

  const AppointmentCard = ({ appt }) => (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-start gap-4">
      <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 rounded-2xl flex items-center justify-center shrink-0">
        <Calendar className="w-6 h-6 text-sky-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground">{appt.pet_name}</p>
            <p className="text-sm text-muted-foreground capitalize">{appt.type}{appt.clinic_name ? ` · ${appt.clinic_name}` : ''}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize shrink-0 ${STATUSES[appt.status] || 'text-muted-foreground bg-muted'}`}>{appt.status}</span>
        </div>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{appt.date}</span>
          {appt.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{appt.time}</span>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-end">
          <Button onClick={() => setShowForm(true)} className="rounded-2xl gap-2">
            <Plus className="w-4 h-4" /> {t('Book', 'احجز')}
          </Button>
        </div>
        {isLoading && <div className="text-center py-12 text-muted-foreground">{t('Loading...', 'جاري التحميل...')}</div>}

        {upcoming.length > 0 && (
          <div>
            <h2 className="font-heading font-bold text-foreground mb-4">{t('Upcoming', 'القادمة')}</h2>
            <div className="space-y-3">{upcoming.map(a => <AppointmentCard key={a.id} appt={a} />)}</div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <h2 className="font-heading font-bold text-muted-foreground mb-4">{t('Past', 'السابقة')}</h2>
            <div className="space-y-3">{past.map(a => <AppointmentCard key={a.id} appt={a} />)}</div>
          </div>
        )}

        {!isLoading && appointments.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">{t('No appointments yet', 'لا توجد مواعيد بعد')}</h3>
            <p className="text-muted-foreground mb-6">{t('Book your first vet appointment', 'احجز أول موعد بيطري')}</p>
            <Button onClick={() => setShowForm(true)} className="rounded-2xl gap-2"><Plus className="w-4 h-4" /> {t('Book Appointment', 'احجز موعداً')}</Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="relative bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold text-foreground">{t('Book Appointment', 'حجز موعد')}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t('Pet Name', 'اسم الحيوان')} *</Label><Input required value={form.pet_name} onChange={e => setForm(f => ({ ...f, pet_name: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div>
                    <Label>{t('Type', 'النوع')} *</Label>
                    <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                      <SelectContent>{TYPES.map(tp => <SelectItem key={tp} value={tp} className="capitalize">{tp}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>{t('Date', 'التاريخ')} *</Label><Input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Time', 'الوقت')}</Label><Input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Clinic', 'العيادة')}</Label><Input value={form.clinic_name} onChange={e => setForm(f => ({ ...f, clinic_name: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Vet Name', 'اسم الطبيب')}</Label><Input value={form.vet_name} onChange={e => setForm(f => ({ ...f, vet_name: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Your Name', 'اسمك')} *</Label><Input required value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Phone', 'الهاتف')}</Label><Input value={form.owner_phone} onChange={e => setForm(f => ({ ...f, owner_phone: e.target.value }))} className="rounded-xl mt-1" /></div>
                </div>
                <div><Label>{t('Notes', 'ملاحظات')}</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="rounded-xl mt-1" /></div>
                <Button type="submit" disabled={loading || !form.pet_name || !form.date || !form.type} className="w-full rounded-2xl h-12 font-bold">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}{t('Book Appointment', 'حجز الموعد')}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}