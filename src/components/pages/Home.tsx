"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import { Bot, Stethoscope, PawPrint, Plane, MapPin, Heart, Shield, Clock, ChevronRight, Star, ArrowRight, Users, BadgeCheck } from 'lucide-react';
import VetCard from '@/components/vets/VetCard';
import HostCard from '@/components/hosts/HostCard';
import PartnerDealsSection from '@/components/home/PartnerDealsSection';
import VerifiedVetsSection from '@/components/home/VerifiedVetsSection';
import { Button } from '@/components/ui/button';

const HERO_MAIN = 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=900&q=80';
const HERO_THUMB1 = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=300&q=80';
const HERO_THUMB2 = 'https://images.unsplash.com/photo-1560743641-3914f2c45636?w=300&q=80';
const AVATAR1 = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=60&q=80';
const AVATAR2 = 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=60&q=80';
const AVATAR3 = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=60&q=80';

const PET_FALLBACKS = {
  dog: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&q=90',
  cat: 'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&q=90',
  bird: 'https://images.unsplash.com/photo-1520808663317-647b476a81b9?w=800&q=90',
  rabbit: 'https://images.unsplash.com/photo-1612847172978-84bef5cb3038?w=800&q=90',
  fish: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=800&q=90',
  reptile: 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=800&q=90',
  other: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=90',
};

const SAMPLE_HOSTS = [
  { id: 'h1', full_name: 'Sara Al-Dosari', city: 'Riyadh', neighborhood: 'Al Olaya', bio: 'Passionate animal lover with 5 years hosting experience.', services: ['boarding', 'daycare'], price_per_night: 120, rating: 4.9, review_count: 87, is_available: true, photo_url: 'https://images.unsplash.com/photo-1488426862026-56bde9d879af?w=400&q=80' },
  { id: 'h2', full_name: 'Mohammed Al-Qahtani', city: 'Jeddah', neighborhood: 'Al Rawdah', bio: 'Dog trainer and boarding specialist. Large yard available.', services: ['boarding', 'dog_walking'], price_per_night: 95, rating: 4.8, review_count: 54, is_available: true, has_yard: true, photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
  { id: 'h3', full_name: 'Nora Al-Harbi', city: 'Dammam', neighborhood: 'Al Faisaliyah', bio: 'Vet nurse offering professional home care.', services: ['home_sitting', 'daycare'], price_per_day: 80, rating: 5.0, review_count: 31, is_available: true, photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80' },
  { id: 'h4', full_name: 'Khalid Al-Otaibi', city: 'Riyadh', neighborhood: 'Al Malaz', bio: 'Lifelong pet owner. Cats, small dogs and birds are my specialty!', services: ['boarding', 'home_sitting'], price_per_night: 110, rating: 4.7, review_count: 42, is_available: true, photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' },
];

const features = [
  { icon: Bot, gradient: 'from-violet-600 to-purple-700', labelEn: 'AI Health Assistant', labelAr: 'مساعد الصحة الذكي', descEn: 'Symptom checker & emergency alerts', descAr: 'فحص الأعراض وتنبيهات الطوارئ', to: '/ai-chat', img: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&q=80' },
  { icon: PawPrint, gradient: 'from-orange-500 to-amber-600', labelEn: 'Pet Profiles', labelAr: 'ملفات الحيوانات', descEn: 'Vaccination records & health passports', descAr: 'سجلات التطعيم وجوازات الصحة', to: '/pets', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80' },
  { icon: Stethoscope, gradient: 'from-emerald-500 to-teal-600', labelEn: 'Find a Vet', labelAr: 'ابحث عن طبيب', descEn: 'Nearby clinics & emergency care', descAr: 'عيادات قريبة ورعاية طارئة', to: '/vets', img: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&q=80' },
  { icon: Plane, gradient: 'from-sky-500 to-blue-600', labelEn: 'Travel Compliance', labelAr: 'امتثال السفر', descEn: 'Import/export Saudi pet regulations', descAr: 'لوائح استيراد وتصدير الحيوانات', to: '/travel', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80' },
  { icon: Heart, gradient: 'from-rose-500 to-pink-600', labelEn: 'Adoption Center', labelAr: 'مركز التبني', descEn: 'Find your perfect companion', descAr: 'اعثر على رفيقك المثالي', to: '/adopt', img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80' },
  { icon: MapPin, gradient: 'from-orange-500 to-red-500', labelEn: 'Lost & Found', labelAr: 'المفقودات', descEn: 'Report & find lost pets', descAr: 'أبلغ عن الحيوانات الضائعة', to: '/lost-pets', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80' },
];

const stats = [
  { numEn: '12,000+', numAr: '+١٢٠٠٠', labelEn: 'Pet Owners', labelAr: 'مالك حيوان أليف' },
  { numEn: '350+', numAr: '+٣٥٠', labelEn: 'Verified Vets', labelAr: 'طبيب معتمد' },
  { numEn: '15', numAr: '١٥', labelEn: 'Saudi Cities', labelAr: 'مدينة سعودية' },
  { numEn: '24/7', numAr: '٢٤/٧', labelEn: 'Emergency Support', labelAr: 'دعم طارئ' },
];

const SAMPLE_VETS = [
  { id: 'v1', name: 'Al-Noor Vet Clinic', city: 'Riyadh', phone: '+966-11-123-4567', email: 'info@alnoor.com', rating: 4.9, services: ['emergency', 'surgery', 'vaccination'], image_url: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&q=85' },
  { id: 'v2', name: 'Pet Care Plus', city: 'Jeddah', phone: '+966-12-234-5678', email: 'hello@petcareplus.com', rating: 4.8, services: ['checkup', 'dental', 'grooming'], image_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=85' },
  { id: 'v3', name: 'Paws Medical Center', city: 'Dammam', phone: '+966-13-345-6789', email: 'contact@pawsmedical.com', rating: 4.7, services: ['xray', 'lab', 'ultrasound'], image_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=85' },
  { id: 'v4', name: 'Happy Tails Veterinary', city: 'Riyadh', phone: '+966-11-456-7890', email: 'support@happytails.com', rating: 4.9, services: ['vaccination', 'microchip', 'consultation'], image_url: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=85' },
  { id: 'v5', name: 'Advanced Pet Hospital', city: 'Jeddah', phone: '+966-12-567-8901', email: 'admin@advancedpet.com', rating: 4.8, services: ['surgery', 'emergency', 'icu'], image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=85' },
];

function FeaturedVetsSection({ t }) {
  const { data: vets = [] } = useQuery({
    queryKey: ['featured-vets'],
    queryFn: () => entities.VetClinic.filter({ is_featured: true }, '-rating', 5),
    initialData: [],
  });

  const displayVets = vets.length > 0 ? vets : SAMPLE_VETS;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BadgeCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              {t('Verified & Trusted', 'موثق ومعتمد')}
            </span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {t('Featured Vet Clinics', 'عيادات بيطرية مميزة')}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('Verified partners providing top-tier care for your pets', 'شركاء موثقون يقدمون أعلى مستويات الرعاية لحيوانك')}
          </p>
        </div>
        <Link to="/vets" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all shrink-0">
          {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {displayVets.slice(0, 5).map((vet, i) => (
          <VetCard key={vet.id} clinic={vet} index={i} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link to="/vet-advertise">
          <span className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium px-5 py-2.5 rounded-xl text-sm transition-all border border-emerald-200">
            <BadgeCheck className="w-4 h-4" /> {t('Get Your Clinic Featured', 'احصل على إدراج عيادتك')}
          </span>
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();

  const { data: pets = [] } = useQuery({
    queryKey: ['featured-pets'],
    queryFn: () => entities.Pet.filter({ status: 'available' }, '-created_date', 6),
    initialData: [],
  });

  const { data: fetchedHosts = [] } = useQuery({
    queryKey: ['featured-hosts'],
    queryFn: () => entities.PetHost.filter({ is_available: true }, '-rating', 4),
    initialData: [],
  });

  const hosts = fetchedHosts.length > 0 ? fetchedHosts : SAMPLE_HOSTS;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm font-semibold text-primary mb-6">
                <Heart className="w-4 h-4" />
                {t("Saudi Arabia's #1 Pet Care Platform", 'منصة رعاية الحيوانات الأليفة الأولى في السعودية')}
              </div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-5">
                {t('Reliable &', 'رعاية موثوقة')}<br />
                {t('Loving', 'وحانية')}<br />
                <span className="text-primary italic">{t('Pet Care', 'لحيواناتك')}</span>
              </h1>
              <p className="text-base text-muted-foreground mb-8 max-w-md leading-relaxed">
                {t(
                  'Professional pet sitters, verified vets, AI health guidance, and travel compliance — all in one place for Saudi pet owners.',
                  'مربيو حيوانات محترفون، أطباء معتمدون، إرشادات صحية بالذكاء الاصطناعي، وامتثال السفر — كل ذلك في مكان واحد.'
                )}
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link to="/dashboard">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl px-8 shadow-lg shadow-primary/25">
                    {t('Get Started', 'ابدأ الآن')}
                    <ArrowRight className="w-4 h-4 ms-2" />
                  </Button>
                </Link>
                <Link to="/ai-chat">
                  <Button size="lg" variant="outline" className="rounded-2xl px-8 border-border hover:border-primary hover:text-primary">
                    <Bot className="w-4 h-4 me-2" />
                    {t('AI Health Check', 'فحص صحي ذكي')}
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div key={s.labelEn} className="text-center bg-card border border-border rounded-2xl py-3 px-2">
                    <div className="font-heading text-xl font-extrabold text-primary">{t(s.numEn, s.numAr)}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">{t(s.labelEn, s.labelAr)}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }} className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl" style={{ aspectRatio: '4/5', maxHeight: '580px' }}>
                <img src={HERO_MAIN} alt="Happy pet owner with golden retriever" className="w-full h-full object-cover" />
                <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <img src={AVATAR1} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="" />
                    <img src={AVATAR2} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="" />
                    <img src={AVATAR3} className="w-8 h-8 rounded-full border-2 border-white object-cover" alt="" />
                  </div>
                  <div>
                    <div className="flex text-primary text-xs">★★★★★</div>
                    <div className="text-xs font-semibold text-foreground">4.9 · 12,000+ {t('owners', 'مالك')}</div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-32 h-36 rounded-2xl overflow-hidden shadow-xl border-4 border-background hidden lg:block">
                <img src={HERO_THUMB1} alt="Dogs playing" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-4 -right-6 w-28 h-28 rounded-2xl overflow-hidden shadow-xl border-4 border-background hidden lg:block">
                <img src={HERO_THUMB2} alt="Cat" className="w-full h-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-3">
            {t('Everything Your Pet Needs', 'كل ما يحتاجه حيوانك الأليف')}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('Comprehensive care ecosystem designed for Saudi pet owners', 'منظومة رعاية شاملة مصممة لأصحاب الحيوانات الأليفة في المملكة')}
          </p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <motion.div key={f.labelEn} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Link href={f.to} className="block h-full">
                <div className="group relative rounded-2xl overflow-hidden border border-border hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full">
                  <div className="relative h-40 overflow-hidden">
                    <img src={f.img} alt={t(f.labelEn, f.labelAr)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-70`} />
                    <div className="absolute inset-0 flex flex-col justify-end p-4">
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mb-2">
                        <f.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-heading font-bold text-white text-lg leading-tight drop-shadow">{t(f.labelEn, f.labelAr)}</h3>
                    </div>
                  </div>
                  <div className="bg-card p-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{t(f.descEn, f.descAr)}</p>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ms-2" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
       <div className="bg-muted/50 border-y border-border py-10">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
           {[
             { icon: Star, en: '4.9/5 Rating', ar: 'تقييم ٤.٩/٥', desc_en: 'From 8,000+ reviews', desc_ar: 'من أكثر من ٨٠٠٠ تقييم' },
             { icon: Clock, en: '24/7 Emergency', ar: 'طوارئ ٢٤/٧', desc_en: 'Always here for you', desc_ar: 'نحن دائماً معك' },
           ].map((item) => (
             <div key={item.en} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="font-heading font-bold text-foreground">{t(item.en, item.ar)}</div>
              <div className="text-sm text-muted-foreground">{t(item.desc_en, item.desc_ar)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Hosts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {t('Top Pet Hosts Near You', 'أفضل مضيفي الحيوانات')}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">{t('Verified, reviewed and ready to welcome your pet', 'موثقون ومستعدون لاستقبال حيوانك')}</p>
          </div>
          <Link to="/hosts" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all shrink-0">
            {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {hosts.map(host => (
            <Link key={host.id} to="/hosts">
              <HostCard host={host} onSelect={() => {}} />
            </Link>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/become-host">
            <span className="inline-flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-medium px-5 py-2.5 rounded-xl text-sm transition-all border border-border">
              <Users className="w-4 h-4 text-primary" /> {t('Become a Host', 'كن مضيفًا')}
            </span>
          </Link>
        </div>
      </div>

      {/* Featured Pets */}
      {pets.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {t('Pets Looking for Homes', 'حيوانات تبحث عن منزل')}
            </h2>
            <Link to="/adopt" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {pets.slice(0, 6).map((pet) => (
              <Link key={pet.id} to="/adopt">
                <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    <img
                      src={pet.image_url || PET_FALLBACKS[pet.species] || PET_FALLBACKS.other}
                      alt={pet.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2">
                    <p className="font-semibold text-foreground text-xs truncate">{pet.name}</p>
                    <p className="text-xs text-muted-foreground capitalize truncate">{pet.species}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Verified Vets */}
      <FeaturedVetsSection t={t} />

      {/* Verified Subscription Partners */}
      <VerifiedVetsSection />

      {/* Partner Deals */}
      <div className="border-t border-border">
        <PartnerDealsSection />
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-primary to-emerald-600 rounded-3xl p-8 lg:p-12 text-white text-center">
          <h2 className="font-heading text-3xl font-bold mb-3">
            {t("Start Your Pet's Health Journey", 'ابدأ رحلة صحة حيوانك الأليف')}
          </h2>
          <p className="text-white/80 mb-6">
            {t('Join thousands of Saudi pet owners trusting Saudi Petsitters', 'انضم لآلاف أصحاب الحيوانات الأليفة الذين يثقون بـ سعودي بيتسيترز')}
          </p>
          <Link to="/dashboard">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold rounded-2xl px-10">
              {t('Create Free Account', 'إنشاء حساب مجاني')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}