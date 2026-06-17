"use client";

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/lib/language-context';
import { useAuth } from '@/lib/auth-context';
import { getDefaultHomePath } from '@/lib/auth/routes';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import { Stethoscope, MapPin, Clock, ChevronLeft, ChevronRight, Star, Users, BadgeCheck } from 'lucide-react';
import VetCard from '@/components/vets/VetCard';
import HostCard from '@/components/hosts/HostCard';
import HeroSlider from '@/components/home/HeroSlider';
import PartnerDealsSection from '@/components/home/PartnerDealsSection';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
          <Link href="/partners?type=vet-clinics">
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
  const { user, isAdmin } = useAuth();
  const isAuthenticated = !!user;
  const homePath = isAuthenticated ? getDefaultHomePath(isAdmin) : '/login';

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
      <HeroSlider />

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
            href={homePath}
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-white text-primary hover:bg-white/90 font-bold rounded-2xl px-10"
            )}
          >
            {t(
              isAuthenticated
                ? isAdmin
                  ? 'Go to Admin Console'
                  : 'Go to Dashboard'
                : 'Create Free Account',
              isAuthenticated
                ? isAdmin
                  ? 'لوحة الإدارة'
                  : 'لوحة التحكم'
                : 'إنشاء حساب مجاني'
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}