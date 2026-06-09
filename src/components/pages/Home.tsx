"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { isNavPathVisible } from '@/lib/auth/navigation';
import { usePetHealthAssistant } from '@/lib/pet-health-assistant-context';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import { Bot, Stethoscope, PawPrint, Plane, MapPin, Heart, Clock, ChevronLeft, ChevronRight, Star, ArrowRight, Users, BadgeCheck } from 'lucide-react';
import VetCard from '@/components/vets/VetCard';
import HostCard from '@/components/hosts/HostCard';
import PartnerDealsSection from '@/components/home/PartnerDealsSection';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

type PetFallbackSpecies = keyof typeof PET_FALLBACKS;

type FeaturedPet = {
  id: string;
  name: string;
  species: string;
  image_url?: string | null;
};

type FeaturedVetClinic = {
  id: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  is_featured?: boolean;
  emergency_available?: boolean;
  rating?: number;
  services?: string[];
  opening_hours?: string;
};

function toFeaturedPet(pet: Record<string, unknown>): FeaturedPet {
  return {
    id: typeof pet.id === 'string' ? pet.id : String(pet.id ?? pet.name ?? 'pet'),
    name: typeof pet.name === 'string' ? pet.name : 'Pet',
    species: typeof pet.species === 'string' ? pet.species : 'other',
    image_url: typeof pet.image_url === 'string' ? pet.image_url : null,
  };
}

function toFeaturedVetClinic(vet: Record<string, unknown>): FeaturedVetClinic {
  return {
    id: typeof vet.id === 'string' ? vet.id : String(vet.id ?? vet.name ?? 'vet'),
    name: typeof vet.name === 'string' ? vet.name : 'Vet Clinic',
    city: typeof vet.city === 'string' ? vet.city : undefined,
    address: typeof vet.address === 'string' ? vet.address : undefined,
    phone: typeof vet.phone === 'string' ? vet.phone : undefined,
    email: typeof vet.email === 'string' ? vet.email : undefined,
    website: typeof vet.website === 'string' ? vet.website : undefined,
    image_url: typeof vet.image_url === 'string' ? vet.image_url : undefined,
    is_featured: typeof vet.is_featured === 'boolean' ? vet.is_featured : undefined,
    emergency_available: typeof vet.emergency_available === 'boolean' ? vet.emergency_available : undefined,
    rating: typeof vet.rating === 'number' ? vet.rating : Number(vet.rating ?? 0),
    services: Array.isArray(vet.services) ? vet.services.filter((service): service is string => typeof service === 'string') : undefined,
    opening_hours: typeof vet.opening_hours === 'string' ? vet.opening_hours : undefined,
  };
}

function getPetImageUrl(pet: FeaturedPet) {
  const fallbackSpecies = pet.species in PET_FALLBACKS
    ? (pet.species as PetFallbackSpecies)
    : 'other';

  return pet.image_url || PET_FALLBACKS[fallbackSpecies];
}

const features = [
  { icon: Bot, gradient: 'from-primary to-primary/80', labelEn: 'AI Pet Care Assistant', labelAr: 'مساعد رعاية الحيوانات الذكي', descEn: 'Feeding, travel, heat safety & health guidance', descAr: 'إرشادات التغذية والسفر والحرارة والصحة', openAssistant: true as const, img: 'https://images.unsplash.com/photo-1576671081837-49000212a370?w=600&q=80' },
  { icon: PawPrint, gradient: 'from-accent to-warning', labelEn: 'Pet Profiles', labelAr: 'ملفات الحيوانات', descEn: 'Vaccination records & health passports', descAr: 'سجلات التطعيم وجوازات الصحة', to: '/pets', img: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&q=80' },
  { icon: Stethoscope, gradient: 'from-success to-success/80', labelEn: 'Find a Vet', labelAr: 'ابحث عن طبيب', descEn: 'Nearby clinics & emergency care', descAr: 'عيادات قريبة ورعاية طارئة', to: '/vets', img: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&q=80' },
  { icon: Plane, gradient: 'from-info to-primary', labelEn: 'Travel Compliance', labelAr: 'امتثال السفر', descEn: 'Import/export Saudi pet regulations', descAr: 'لوائح استيراد وتصدير الحيوانات', to: '/travel', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80' },
  { icon: Heart, gradient: 'from-primary to-accent', labelEn: 'Adoption Center', labelAr: 'مركز التبني', descEn: 'Find your perfect companion', descAr: 'اعثر على رفيقك المثالي', to: '/adopt', img: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80' },
  { icon: MapPin, gradient: 'from-warning to-destructive', labelEn: 'Lost & Found', labelAr: 'المفقودات', descEn: 'Report & find lost pets', descAr: 'أبلغ عن الحيوانات الضائعة', to: '/lost-pets', img: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&q=80' },
];

const trustStats = [
  { icon: Star, headlineEn: '4.9/5 Rating', headlineAr: 'تقييم ٤.٩/٥', subEn: 'From 8,000+ reviews', subAr: 'من أكثر من ٨٠٠٠ تقييم' },
  { icon: Clock, headlineEn: '24/7 Emergency', headlineAr: 'طوارئ ٢٤/٧', subEn: 'Always here for you', subAr: 'نحن دائماً معك' },
  { icon: Users, headlineEn: '12,000+', headlineAr: '+١٢٠٠٠', subEn: 'Pet Owners', subAr: 'مالك حيوان أليف' },
  { icon: Stethoscope, headlineEn: '350+', headlineAr: '+٣٥٠', subEn: 'Verified Vets', subAr: 'طبيب معتمد' },
  { icon: MapPin, headlineEn: '15', headlineAr: '١٥', subEn: 'Saudi Cities', subAr: 'مدينة سعودية' },
];

function FeaturedVetsSection({ t }) {
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const { data: vets = [] } = useQuery({
    queryKey: ['featured-vets'],
    queryFn: async () => {
      const featuredVets = await entities.VetClinic.filter({ is_featured: true }, '-rating', 8);
      return featuredVets.map(toFeaturedVetClinic);
    },
  });

  const scrollSlider = (direction: 'previous' | 'next') => {
    const slider = sliderRef.current;
    if (!slider) return;

    const cardWidth = slider.firstElementChild?.clientWidth ?? slider.clientWidth;
    slider.scrollBy({
      left: direction === 'previous' ? -(cardWidth + 20) : cardWidth + 20,
      behavior: 'smooth',
    });
  };

  return (
    <div className="bg-gradient-to-br from-success-muted to-info-muted border-y border-success-border py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1.5 bg-success text-success-foreground text-xs font-bold px-3 py-1 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" />
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
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => scrollSlider('previous')}
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-success-border bg-card text-success shadow-sm transition-all hover:bg-success-muted"
              aria-label={t('Previous featured vets', 'الأطباء المميزون السابقون')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollSlider('next')}
              className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-success-border bg-card text-success shadow-sm transition-all hover:bg-success-muted"
              aria-label={t('Next featured vets', 'الأطباء المميزون التاليون')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Link href="/vets" className="text-success text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div
          ref={sliderRef}
          className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
        >
          {vets.map((vet, i) => (
            <div key={vet.id} className="w-[82%] shrink-0 snap-start sm:w-[calc(50%_-_0.625rem)] lg:w-[calc(25%_-_0.9375rem)]">
              <VetCard clinic={vet} index={i} variant="trusted" />
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/vet-advertise">
            <span className="inline-flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-success/20">
              <BadgeCheck className="w-4 h-4" /> {t('Get Your Clinic Featured', 'احصل على إدراج عيادتك')}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useLanguage();
  const { user, navigateToLogin } = useAuth();
  const { openAssistant } = usePetHealthAssistant();
  const isAuthenticated = !!user;

  const { data: pets = [] } = useQuery({
    queryKey: ['featured-pets'],
    queryFn: async () => {
      const featuredPets = await entities.Pet.filter({ status: 'available' }, '-created_date', 6);
      return featuredPets.map(toFeaturedPet);
    },
  });

  const { data: fetchedHosts = [] } = useQuery({
    queryKey: ['featured-hosts'],
    queryFn: () => entities.PetHost.filter({ is_available: true }, '-rating', 4),
  });

  const hosts = fetchedHosts;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }}>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-5">
                {t('Reliable &', 'رعاية موثوقة')}<br />
                {t('Loving', 'وحانية')}<br />
                <span className="text-primary italic">{t('Pet Care', 'لحيواناتك')}</span>
              </h1>
              <p className="text-base text-muted-foreground mb-8 max-w-md leading-relaxed">
                {t(
                  'Professional pet sitters, verified vets, AI pet care guidance, and travel compliance — all in one place for Saudi pet owners.',
                  'مربيو حيوانات محترفون، أطباء معتمدون، إرشادات صحية بالذكاء الاصطناعي، وامتثال السفر — كل ذلك في مكان واحد.'
                )}
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href={isAuthenticated ? '/dashboard' : '/login'}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-2xl px-8 shadow-lg shadow-primary/25"
                  )}
                >
                  {t(isAuthenticated ? 'Go to Dashboard' : 'Get Started', isAuthenticated ? 'لوحة التحكم' : 'ابدأ الآن')}
                  <ArrowRight className="w-4 h-4 ms-2" />
                </Link>
                {isAuthenticated ? (
                  <Button
                    type="button"
                    size="lg"
                    variant="outline"
                    onClick={openAssistant}
                    className="rounded-2xl px-8 border-border hover:border-primary hover:text-primary"
                  >
                    <Bot className="w-4 h-4 me-2" />
                    {t('AI Pet Care', 'رعاية ذكية')}
                  </Button>
                ) : (
                  <Link
                    href="/vets"
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" }),
                      "rounded-2xl px-8 border-border hover:border-primary hover:text-primary"
                    )}
                  >
                    <Stethoscope className="w-4 h-4 me-2" />
                    {t('Find a Vet', 'ابحث عن طبيب')}
                  </Link>
                )}
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
          {features.map((f, i) => {
            const featureHref = f.to && isNavPathVisible(f.to, isAuthenticated) ? f.to : '/login';
            const featureCard = (
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
            );
            return (
              <motion.div key={f.labelEn} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                {"openAssistant" in f && f.openAssistant ? (
                  <button type="button" onClick={isAuthenticated ? openAssistant : navigateToLogin} className="block h-full w-full text-start">
                    {featureCard}
                  </button>
                ) : (
                  <Link href={featureHref} className="block h-full">
                    {featureCard}
                  </Link>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="bg-primary border-y border-primary py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 text-center">
          {trustStats.map((item) => (
            <div key={item.headlineEn} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="font-heading font-bold text-primary-foreground">{t(item.headlineEn, item.headlineAr)}</div>
              <div className="text-sm text-primary-foreground/80">{t(item.subEn, item.subAr)}</div>
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
          <Link href="/hosts" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all shrink-0">
            {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {hosts.map(host => (
            <HostCard key={String(host.id)} host={host} onSelect={() => {}} />
          ))}
        </div>
        {isAuthenticated && (
          <div className="text-center mt-8">
            <Link href="/become-host">
              <span className="inline-flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground font-medium px-5 py-2.5 rounded-xl text-sm transition-all border border-border">
                <Users className="w-4 h-4 text-primary" /> {t('Become a Host', 'كن مضيفًا')}
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* Featured Pets */}
      {pets.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-border">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground">
              {t('Pets Looking for Homes', 'حيوانات تبحث عن منزل')}
            </h2>
            <Link href="/adopt" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              {t('View all', 'عرض الكل')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {pets.slice(0, 6).map((pet) => (
              <Link key={pet.id} href="/adopt">
                <div className="bg-primary border border-primary rounded-xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="aspect-[4/3] bg-muted overflow-hidden">
                    <img
                      src={getPetImageUrl(pet)}
                      alt={pet.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-2">
                    <p className="font-semibold text-primary-foreground text-xs truncate">{pet.name}</p>
                    <p className="text-xs text-primary-foreground/80 capitalize truncate">{pet.species}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Verified Vets */}
      <FeaturedVetsSection t={t} />

      {/* Partner Deals */}
      <div className="border-t border-border">
        <PartnerDealsSection />
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
        <div className="bg-gradient-to-r from-primary to-success rounded-3xl p-8 lg:p-12 text-white text-center">
          <h2 className="font-heading text-3xl font-bold mb-3">
            {t("Start Your Pet's Health Journey", 'ابدأ رحلة صحة حيوانك الأليف')}
          </h2>
          <p className="text-white/80 mb-6">
            {t('Join thousands of Saudi pet owners trusting Saudi Petsitters', 'انضم لآلاف أصحاب الحيوانات الأليفة الذين يثقون بـ سعودي بيتسيترز')}
          </p>
          <Link
            href={isAuthenticated ? '/dashboard' : '/login'}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-white text-primary hover:bg-white/90 font-bold rounded-2xl px-10"
            )}
          >
            {t(
              isAuthenticated ? 'Go to Dashboard' : 'Create Free Account',
              isAuthenticated ? 'لوحة التحكم' : 'إنشاء حساب مجاني'
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}