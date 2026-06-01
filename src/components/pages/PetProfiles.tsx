"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { useLanguage } from '@/lib/language-context';
import { PawPrint, Plus, X, Syringe, FileText, Edit2, Trash2, ChevronDown } from 'lucide-react';
import ImageUpload from '@/components/common/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'reptile', 'other'];

const emptyForm = { name: '', species: '', breed: '', age: '', gender: '', weight_kg: '', color: '', microchip_number: '', notes: '', photo_url: '' };

export default function PetProfiles() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ['my-pets'],
    queryFn: () => entities.UserPet.list('-created_date', 50),
    initialData: [],
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['vaccinations'],
    queryFn: () => entities.Vaccination.list('-date_given', 100),
    initialData: [],
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    await entities.UserPet.create({ ...form, weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined });
    toast({ title: t('Pet added!', 'تمت إضافة الحيوان!') });
    qc.invalidateQueries(['my-pets']);
    setForm(emptyForm);
    setShowForm(false);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await entities.UserPet.delete(id);
    qc.invalidateQueries(['my-pets']);
    toast({ title: t('Pet removed', 'تمت الإزالة') });
  };

  const petVaccines = (petName) => vaccinations.filter(v => v.pet_name === petName);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/10 to-accent/5 px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">{t('My Pets', 'حيواناتي')}</h1>
            <p className="text-muted-foreground text-sm mt-1">{t('Health records & profiles', 'السجلات الصحية والملفات')}</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="rounded-2xl gap-2">
            <Plus className="w-4 h-4" /> {t('Add Pet', 'أضف حيوانًا')}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {isLoading && <div className="text-center py-12 text-muted-foreground">{t('Loading...', 'جاري التحميل...')}</div>}

        {!isLoading && pets.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <PawPrint className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-heading text-xl font-bold text-foreground mb-2">{t('No pets yet', 'لا توجد حيوانات بعد')}</h3>
            <p className="text-muted-foreground mb-6">{t('Add your first pet to start tracking health & vaccinations', 'أضف حيوانك الأول لتبدأ بتتبع صحته وتطعيماته')}</p>
            <Button onClick={() => setShowForm(true)} className="rounded-2xl gap-2">
              <Plus className="w-4 h-4" /> {t('Add First Pet', 'أضف أول حيوان')}
            </Button>
          </motion.div>
        )}

        {pets.map((pet) => {
          const vaccines = petVaccines(pet.name);
          const isOpen = expanded === pet.id;
          return (
            <motion.div key={pet.id} layout className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : pet.id)}>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                  {pet.photo_url ? (
                    <img src={pet.photo_url} alt={pet.name} className="w-full h-full object-cover" />
                  ) : <PawPrint className="w-7 h-7 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-foreground">{pet.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{pet.species}{pet.breed ? ` · ${pet.breed}` : ''}{pet.age ? ` · ${pet.age}` : ''}</p>
                  <div className="flex gap-2 mt-1">
                    {vaccines.length > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">
                        <Syringe className="w-3 h-3 inline me-1" />{vaccines.length} {t('vaccines', 'تطعيمات')}
                      </span>
                    )}
                    {pet.microchip_number && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                        {t('Microchipped', 'محقون')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(pet.id); }} className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-border">
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                      {[
                        [t('Gender', 'الجنس'), pet.gender],
                        [t('Weight', 'الوزن'), pet.weight_kg ? `${pet.weight_kg} kg` : null],
                        [t('Color', 'اللون'), pet.color],
                        [t('Microchip', 'الرقيحة'), pet.microchip_number],
                        [t('Insurance', 'التأمين'), pet.insurance_info],
                      ].filter(([, v]) => v).map(([label, val]) => (
                        <div key={label} className="bg-muted/50 rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                          <p className="font-medium text-foreground capitalize">{val}</p>
                        </div>
                      ))}
                    </div>
                    {vaccines.length > 0 && (
                      <div className="px-4 pb-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">{t('Vaccination History', 'سجل التطعيمات')}</p>
                        <div className="space-y-2">
                          {vaccines.map(v => (
                            <div key={v.id} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-3 py-2 text-sm">
                              <span className="font-medium text-foreground">{v.vaccine_name}</span>
                              <span className="text-muted-foreground">{v.date_given}{v.next_due_date ? ` → ${v.next_due_date}` : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {pet.notes && (
                      <div className="px-4 pb-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">{t('Notes', 'ملاحظات')}</p>
                        <p className="text-sm text-foreground bg-muted/50 rounded-xl p-3">{pet.notes}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Add Pet Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="relative bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold text-foreground">{t('Add New Pet', 'إضافة حيوان جديد')}</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex justify-center">
                  <ImageUpload value={form.photo_url} onChange={url => setForm(f => ({ ...f, photo_url: url }))} label="Upload Pet Photo" variant="circle" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t('Name', 'الاسم')} *</Label><Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div>
                    <Label>{t('Species', 'النوع')} *</Label>
                    <Select value={form.species} onValueChange={v => setForm(f => ({ ...f, species: v }))}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                      <SelectContent>{SPECIES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>{t('Breed', 'السلالة')}</Label><Input value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Age', 'العمر')}</Label><Input placeholder="e.g. 2 years" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div>
                    <Label>{t('Gender', 'الجنس')}</Label>
                    <Select value={form.gender} onValueChange={v => setForm(f => ({ ...f, gender: v }))}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder={t('Select', 'اختر')} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('Male', 'ذكر')}</SelectItem>
                        <SelectItem value="female">{t('Female', 'أنثى')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>{t('Weight (kg)', 'الوزن (كجم)')}</Label><Input type="number" step="0.1" value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Color', 'اللون')}</Label><Input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="rounded-xl mt-1" /></div>
                  <div><Label>{t('Microchip #', 'رقم الرقيحة')}</Label><Input value={form.microchip_number} onChange={e => setForm(f => ({ ...f, microchip_number: e.target.value }))} className="rounded-xl mt-1" /></div>
                </div>
                <div><Label>{t('Notes', 'ملاحظات')}</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="rounded-xl mt-1" /></div>
                <Button type="submit" disabled={loading || !form.name || !form.species} className="w-full rounded-2xl h-12 font-bold">
                  {loading ? t('Saving...', 'جاري الحفظ...') : t('Add Pet', 'إضافة الحيوان')}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}