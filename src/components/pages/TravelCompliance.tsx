"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { Plane, ChevronRight, ChevronLeft, CheckCircle, Circle, AlertTriangle, FileText, Shield, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const DESTINATIONS = [
  { code: 'US', en: 'United States', ar: 'الولايات المتحدة', rabies: true, daysNotice: 30 },
  { code: 'GB', en: 'United Kingdom', ar: 'المملكة المتحدة', rabies: true, daysNotice: 21 },
  { code: 'AE', en: 'UAE', ar: 'الإمارات العربية المتحدة', rabies: false, daysNotice: 7 },
  { code: 'EG', en: 'Egypt', ar: 'مصر', rabies: false, daysNotice: 14 },
  { code: 'FR', en: 'France', ar: 'فرنسا', rabies: true, daysNotice: 21 },
  { code: 'DE', en: 'Germany', ar: 'ألمانيا', rabies: true, daysNotice: 21 },
  { code: 'JO', en: 'Jordan', ar: 'الأردن', rabies: false, daysNotice: 7 },
  { code: 'KW', en: 'Kuwait', ar: 'الكويت', rabies: false, daysNotice: 7 },
];

const SPECIES_REQS = {
  dog: ['Rabies vaccination', 'Health certificate (within 10 days)', 'Microchip (ISO 11784/11785)', 'MEWA export permit', 'Vet-signed health declaration'],
  cat: ['Rabies vaccination (if required)', 'Health certificate (within 10 days)', 'Microchip recommended', 'MEWA export permit'],
  bird: ['CITES permit (if applicable)', 'Avian influenza clearance', 'Health certificate', 'Import permit from destination country'],
};

const SAUDI_IMPORT_CHECKLIST = [
  { en: 'Original health certificate from country of origin', ar: 'شهادة صحة أصلية من بلد المنشأ' },
  { en: 'Rabies vaccination certificate', ar: 'شهادة تطعيم ضد داء الكلب' },
  { en: 'Valid microchip (ISO standard)', ar: 'رقاقة إلكترونية سارية المفعول (معيار ISO)' },
  { en: 'MEWA import permit', ar: 'تصريح استيراد من وزارة البيئة (مياه وزراعة)' },
  { en: 'Nafath digital identity verification', ar: 'التحقق من الهوية الرقمية عبر نفاذ' },
  { en: 'Pet must not be on Saudi banned species list', ar: 'يجب ألا يكون الحيوان ضمن القائمة المحظورة' },
  { en: 'Pet must be at least 3 months old', ar: 'يجب ألا يقل عمر الحيوان عن 3 أشهر' },
  { en: 'Owner must be Saudi national or resident', ar: 'يجب أن يكون المالك مواطناً سعودياً أو مقيماً' },
];

export default function TravelCompliance() {
  const { t, isRTL } = useLanguage();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState('export');
  const [species, setSpecies] = useState('dog');
  const [destination, setDestination] = useState('');
  const [checked, setChecked] = useState({});

  const dest = DESTINATIONS.find(d => d.code === destination);
  const reqs = SPECIES_REQS[species] || SPECIES_REQS.dog;

  const toggleCheck = (key) => setChecked(c => ({ ...c, [key]: !c[key] }));
  const checkedCount = Object.values(checked).filter(Boolean).length;

  const steps = [
    { en: 'Travel Type', ar: 'نوع السفر' },
    { en: 'Pet & Destination', ar: 'الحيوان والوجهة' },
    { en: 'Requirements', ar: 'المتطلبات' },
    { en: 'Checklist', ar: 'قائمة التحقق' },
  ];

  const goNext = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const goBack = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-sky-500/10 to-primary/5 px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">{t('Travel Compliance Wizard', 'معالج امتثال السفر')}</h1>
              <p className="text-sm text-muted-foreground">{t('Saudi pet import/export requirements', 'متطلبات استيراد وتصدير الحيوانات السعودية')}</p>
            </div>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-1">
            {steps.map((s, i) => (
              <React.Fragment key={s.en}>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${i <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-primary text-white' : i === step ? 'bg-primary/20 text-primary border-2 border-primary' : 'bg-muted text-muted-foreground'}`}>
                    {i < step ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="hidden sm:block">{t(s.en, s.ar)}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 rounded-full ${i < step ? 'bg-primary' : 'bg-muted'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: isRTL ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 20 : -20 }} transition={{ duration: 0.2 }}>

            {step === 0 && (
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">{t('Travel Direction', 'اتجاه السفر')}</h2>
                <p className="text-muted-foreground mb-6">{t('Are you importing to or exporting from Saudi Arabia?', 'هل تستورد إلى أو تصدر من المملكة العربية السعودية؟')}</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { val: 'export', en: 'Exporting', ar: 'تصدير', icon: Plane, desc_en: 'Traveling out of Saudi Arabia with your pet', desc_ar: 'السفر خارج المملكة مع حيوانك الأليف' },
                    { val: 'import', en: 'Importing', ar: 'استيراد', icon: Globe, desc_en: 'Bringing a pet into Saudi Arabia', desc_ar: 'إحضار حيوان إلى المملكة العربية السعودية' },
                  ].map(opt => (
                    <button key={opt.val} onClick={() => { setDirection(opt.val); goNext(); }}
                      className={`p-6 rounded-2xl border-2 text-start hover:border-primary transition-all ${direction === opt.val ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
                      <opt.icon className="w-8 h-8 text-sky-500 mb-3" />
                      <p className="font-heading font-bold text-foreground">{t(opt.en, opt.ar)}</p>
                      <p className="text-sm text-muted-foreground mt-1">{t(opt.desc_en, opt.desc_ar)}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">{t('Pet & Destination', 'الحيوان والوجهة')}</h2>
                <div className="space-y-4 mt-6">
                  <div>
                    <Label>{t('Pet Species', 'نوع الحيوان')}</Label>
                    <Select value={species} onValueChange={setSpecies}>
                      <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dog">{t('Dog', 'كلب')}</SelectItem>
                        <SelectItem value="cat">{t('Cat', 'قطة')}</SelectItem>
                        <SelectItem value="bird">{t('Bird', 'طائر')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {direction === 'export' && (
                    <div>
                      <Label>{t('Destination Country', 'البلد المقصود')}</Label>
                      <Select value={destination} onValueChange={setDestination}>
                        <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder={t('Select country', 'اختر الدولة')} /></SelectTrigger>
                        <SelectContent>
                          {DESTINATIONS.map(d => <SelectItem key={d.code} value={d.code}>{t(d.en, d.ar)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-6">{t('Requirements', 'المتطلبات')}</h2>
                {direction === 'export' && dest && (
                  <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 mb-6">
                    <p className="font-semibold text-sky-800 dark:text-sky-400">{t('Destination', 'الوجهة')}: {t(dest.en, dest.ar)}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className={`flex items-center gap-1 ${dest.rabies ? 'text-red-600' : 'text-emerald-600'}`}>
                        {dest.rabies ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                        {dest.rabies ? t('Rabies titer required', 'اختبار مستوى الأجسام المضادة للكلب مطلوب') : t('No rabies titer', 'لا يوجد اشتراط')}
                      </span>
                      <span className="flex items-center gap-1 text-orange-600"><Clock className="w-3.5 h-3.5" />{dest.daysNotice} {t('days notice', 'يوم إشعار مسبق')}</span>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {(direction === 'import' ? SAUDI_IMPORT_CHECKLIST.map(r => r.en) : reqs).map((req, i) => (
                    <div key={i} className="flex items-start gap-3 bg-card border border-border rounded-xl p-3">
                      <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <p className="text-sm text-foreground">{direction === 'import' ? t(SAUDI_IMPORT_CHECKLIST[i].en, SAUDI_IMPORT_CHECKLIST[i].ar) : req}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-heading text-2xl font-bold text-foreground mb-2">{t('Your Checklist', 'قائمة التحقق الخاصة بك')}</h2>
                <p className="text-muted-foreground mb-6">{t('Track your document preparation progress', 'تتبع تقدمك في تحضير المستندات')}</p>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground font-medium">{t('Progress', 'التقدم')}</span>
                    <span className="text-primary font-bold">{checkedCount}/{(direction === 'import' ? SAUDI_IMPORT_CHECKLIST : reqs).length}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${(checkedCount / (direction === 'import' ? SAUDI_IMPORT_CHECKLIST : reqs).length) * 100}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  {(direction === 'import' ? SAUDI_IMPORT_CHECKLIST : reqs.map(r => ({ en: r, ar: r }))).map((item, i) => {
                    const isChecked = !!checked[i];
                    return (
                      <button key={i} onClick={() => toggleCheck(i)}
                        className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-start transition-all ${isChecked ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-border/80'}`}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isChecked ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                          {isChecked && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`text-sm ${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {direction === 'import' ? t(item.en, item.ar) : item.en}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {checkedCount === (direction === 'import' ? SAUDI_IMPORT_CHECKLIST : reqs).length && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <p className="font-semibold text-emerald-700 dark:text-emerald-400">{t('All requirements complete! Safe travels 🐾', 'اكتملت جميع المتطلبات! سفر آمن 🐾')}</p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className={`flex mt-8 gap-3 ${step > 0 ? 'justify-between' : 'justify-end'}`}>
          {step > 0 && (
            <Button variant="outline" onClick={goBack} className="rounded-2xl gap-2">
              {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {t('Back', 'رجوع')}
            </Button>
          )}
          {step < steps.length - 1 && step !== 0 && (
            <Button onClick={goNext} className="rounded-2xl gap-2" disabled={step === 1 && direction === 'export' && !destination}>
              {t('Continue', 'متابعة')}
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}