"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BadgeCheck, ChevronRight, Phone, MapPin } from 'lucide-react';
import { entities } from '@/lib/data/entities';
import { useLanguage } from '@/lib/language-context';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400&q=80';

type VetSubscriptionCard = {
  id: string;
  clinic_id?: string;
  clinic_name: string;
  city?: string;
  promo_title?: string;
  promo_description?: string;
  specialties: string[];
  contact_phone?: string;
};

function toVetSubscriptionCard(subscription: Record<string, unknown>): VetSubscriptionCard {
  return {
    id: typeof subscription.id === 'string' ? subscription.id : String(subscription.id ?? subscription.clinic_name ?? 'subscription'),
    clinic_id: typeof subscription.clinic_id === 'string' ? subscription.clinic_id : undefined,
    clinic_name: typeof subscription.clinic_name === 'string' ? subscription.clinic_name : 'Vet clinic',
    city: typeof subscription.city === 'string' ? subscription.city : undefined,
    promo_title: typeof subscription.promo_title === 'string' ? subscription.promo_title : undefined,
    promo_description: typeof subscription.promo_description === 'string' ? subscription.promo_description : undefined,
    specialties: Array.isArray(subscription.specialties)
      ? subscription.specialties.filter((specialty): specialty is string => typeof specialty === 'string')
      : [],
    contact_phone: typeof subscription.contact_phone === 'string' ? subscription.contact_phone : undefined,
  };
}

export default function VerifiedVetsSection() {
  const { t } = useLanguage();
  const router = useRouter();

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['active-vet-subscriptions'],
    queryFn: async () => {
      const activeSubscriptions = await entities.VetSubscription.filter({ status: 'active' }, '-created_date', 8);
      return activeSubscriptions.map(toVetSubscriptionCard);
    },
  });

  if (subscriptions.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-success-muted to-info-muted border-y border-success-border py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 bg-success text-success-foreground text-xs font-bold px-3 py-1 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" />
                {t('Verified Partners', 'شركاء معتمدون')}
              </div>
            </div>
            <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
              {t('Trusted Veterinary Clinics', 'عيادات بيطرية موثوقة')}
            </h2>
            <p className="text-muted-foreground text-sm mt-1 max-w-md">
              {t(
                'These clinics have been verified and are active subscription partners on our platform.',
                'هذه العيادات معتمدة وشركاء نشطون على منصتنا.'
              )}
            </p>
          </div>
          <Link
            href="/vets"
            className="text-success text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all shrink-0"
          >
            {t('Browse all vets', 'تصفح جميع الأطباء')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {subscriptions.map((sub, i) => (
            <motion.div
              key={sub.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <div
                role="link"
                tabIndex={0}
                onClick={() => router.push(sub.clinic_id ? `/vets/${sub.clinic_id}` : '/vets')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(sub.clinic_id ? `/vets/${sub.clinic_id}` : '/vets');
                  }
                }}
                className="block h-full cursor-pointer"
              >
                <div className="bg-card rounded-2xl border border-success-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden h-full flex flex-col">
                  {/* Image */}
                  <div className="relative h-36 overflow-hidden">
                    <img
                      src={FALLBACK_IMG}
                      alt={sub.clinic_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-2 right-2 bg-success text-success-foreground text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" /> {t('Verified', 'موثق')}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-heading font-bold text-foreground text-sm mb-1 truncate">{sub.clinic_name}</h3>
                    {sub.city && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="w-3 h-3 shrink-0" /> {sub.city}
                      </div>
                    )}
                    {sub.promo_title && (
                      <div className="bg-success-muted border border-success-border rounded-lg px-2.5 py-1.5 mb-3">
                        <p className="text-xs font-semibold text-success">{sub.promo_title}</p>
                        {sub.promo_description && (
                          <p className="text-xs text-success/80 mt-0.5 line-clamp-2">{sub.promo_description}</p>
                        )}
                      </div>
                    )}
                    {sub.specialties?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-auto">
                        {sub.specialties.slice(0, 3).map((s) => (
                          <span key={s} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                    {sub.contact_phone && (
                      <a
                        href={`tel:${sub.contact_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 flex items-center gap-1.5 text-xs text-success font-medium hover:underline"
                      >
                        <Phone className="w-3 h-3" /> {sub.contact_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Link href="/partners?type=vet-clinics">
            <span className="inline-flex items-center gap-2 bg-success hover:bg-success/90 text-success-foreground font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-md shadow-success/20">
              <BadgeCheck className="w-4 h-4" />
              {t('Join as a Verified Partner', 'انضم كشريك معتمد')}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}