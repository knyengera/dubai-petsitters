"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { useLanguage } from '@/lib/language-context';
import { MapPin, Plus, X, Phone, AlertTriangle, CheckCircle, Search, Loader2 } from 'lucide-react';
import ImageUpload from '@/components/common/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const STATUS_STYLES = { lost: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', found: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', reunited: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };
const STATUS_LABELS = { lost: { en: 'Lost', ar: 'ضائع' }, found: { en: 'Found', ar: 'تم العثور' }, reunited: { en: 'Reunited', ar: 'عاد' } };

const emptyForm = { pet_name: '', species: 'dog', breed: '', color: '', gender: 'unknown', age: '', photo_url: '', last_seen_location: '', last_seen_date: '', city: '', description: '', owner_name: '', owner_phone: '', owner_email: '', reward_offered: '' };

export default function LostPets() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['lost-pets'],
    queryFn: () => entities.LostPet.list('-created_date', 100),
    initialData: [],
  });

  const filtered = pets.filter(p => {
    const matchSearch = !search || p.pet_name?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase()) || p.last_seen_location?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await entities.LostPet.create(form);
    toast({ title: t('Report submitted!', 'تم إرسال البلاغ!') });
    qc.invalidateQueries(['lost-pets']);
    setForm(emptyForm);
    setShowForm(false);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/5 px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">{t('Lost & Found Pets', 'الحيوانات الضائعة والمعثورة')}</h1>
              <p className="text-sm text-muted-foreground mt-1">{t('Report & find missing pets in Saudi Arabia', 'أبلغ عن الحيوانات الضائعة وابحث عنها في المملكة')}</p>
            </div>
            <Button onClick={() => setShowForm(true)} className="rounded-2xl gap-2 bg-rose-500 hover:bg-rose-600">
              <Plus className="w-4 h-4" /> {t('Report', 'بلّغ')}
            </Button>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search by name, city...', 'ابحث بالاسم أو المدينة...')} className="rounded-xl ps-9" />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All', 'الكل')}</SelectItem>
                <SelectItem value="lost">{t('Lost', 'ضائع')}</SelectItem>
                <SelectItem value="found">{t('Found', 'معثور')}</SelectItem>
                <SelectItem value="reunited">{t('Reunited', 'عاد')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && <div className="text-center py-12 text-muted-foreground">{t('Loading...', 'جاري التحميل...')}</div>}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">{t('No reports found', 'لا توجد بلاغات')}</h3>
            <p className="text-muted-foreground mb-6">{t('Help reunite lost pets with their families', 'ساعد في إعادة الحيوانات الضائعة لأسرها')}</p>
            <Button onClick={() => setShowForm(true)} className="rounded-2xl gap-2 bg-rose-500 hover:bg-rose-600"><Plus className="w-4 h-4" /> {t('File Report', 'تقديم بلاغ')}</Button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((pet, i) => (
            <motion.div key={pet.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="flex gap-4 p-4">
                <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                  {pet.photo_url ? <img src={pet.photo_url} alt={pet.pet_name} className="w-full h-full object-cover" /> : <MapPin className="w-8 h-8 text-rose-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading font-bold text-foreground">{pet.pet_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${STATUS_STYLES[pet.status]}`}>
                      {t(STATUS_LABELS[pet.status]?.en || pet.status, STATUS_LABELS[pet.status]?.ar || pet.status)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{pet.city || pet.last_seen_location}</span>
                  </div>
                </div>
              </div>
              {(pet.last_seen_date || pet.description) && (
                <div className="px-4 pb-4 space-y-1">
                  {pet.last_seen_date && <p className="text-xs text-muted-foreground">{t('Last seen', 'آخر ظهور')}: {pet.last_seen_date}</p>}
                  {pet.description && <p className="text-xs text-foreground line-clamp-2">{pet.description}</p>}
                </div>
              )}
              {pet.owner_phone && (
                <div className="px-4 pb-4">
                  <a href={`tel:${pet.owner_phone}`} className="inline-flex items-center gap-2 text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-xl hover:bg-primary/20 transition-colors">
                    <Phone className="w-3.5 h-3.5" /> {pet.owner_phone}
                  </a>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="relative bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold text-foreground">{t('Report Lost Pet', 'الإبلاغ عن حيوان ضائع')}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center">
                  <ImageUpload value={form.photo_url} onChange={url => setForm(f => ({ ...f, photo_url: url }))} label="Upload Pet Photo" variant="square" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t('Pet Name', 'اسم الحيوان')} *</Label><Input required value={form.pet_name} onChange={e => setForm(f => ({ ...f, pet_name: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div>
                    <Label>{t('Species', 'النوع')}</Label>
                    <Select value={form.species} onValueChange={v => setForm(f => ({ ...f, species: v }))}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['dog','cat','bird','rabbit','other'].map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>{t('Breed', 'السلالة')}</Label><Input value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Color', 'اللون')}</Label><Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Last Seen Location', 'آخر مكان شوهد فيه')} *</Label><Input required value={form.last_seen_location} onChange={e => setForm(f => ({ ...f, last_seen_location: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('City', 'المدينة')}</Label><Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Date Lost', 'تاريخ الضياع')}</Label><Input type="date" value={form.last_seen_date} onChange={e => setForm(f => ({ ...f, last_seen_date: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Reward (SAR)', 'مكافأة (ريال)')}</Label><Input value={form.reward_offered} onChange={e => setForm(f => ({ ...f, reward_offered: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Your Name', 'اسمك')} *</Label><Input required value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Phone', 'الهاتف')} *</Label><Input required value={form.owner_phone} onChange={e => setForm(f => ({ ...f, owner_phone: e.target.value }))} className="rounded-xl mt-1" /></div>
                </div>
                <div><Label>{t('Description', 'الوصف')}</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="rounded-xl mt-1" /></div>
                <Button type="submit" disabled={loading} className="w-full rounded-2xl h-12 font-bold bg-rose-500 hover:bg-rose-600">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : null}{t('Submit Report', 'إرسال البلاغ')}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}