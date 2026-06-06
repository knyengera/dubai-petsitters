"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { Tag, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { Badge } from '@/components/ui/badge';

const PARTNER_IMAGES = {
  vet_clinic: 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400&q=80',
  pet_shop: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&q=80',
  grooming: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
  insurance: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80',
  food: 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=400&q=80',
  other: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&q=80',
};

type PartnerType = keyof typeof PARTNER_IMAGES;

type PartnerDeal = {
  id: string;
  title: string;
  description?: string;
  partner_name?: string;
  partner_type: PartnerType;
  discount_label?: string;
  discount_code?: string;
  city?: string;
  image_url?: string;
};

function toPartnerDeal(deal: Record<string, unknown>): PartnerDeal {
  const partnerType = typeof deal.partner_type === 'string' && deal.partner_type in PARTNER_IMAGES
    ? (deal.partner_type as PartnerType)
    : 'other';

  return {
    id: typeof deal.id === 'string' ? deal.id : String(deal.id ?? deal.title ?? 'deal'),
    title: typeof deal.title === 'string' ? deal.title : 'Partner offer',
    description: typeof deal.description === 'string' ? deal.description : undefined,
    partner_name: typeof deal.partner_name === 'string' ? deal.partner_name : undefined,
    partner_type: partnerType,
    discount_label: typeof deal.discount_label === 'string' ? deal.discount_label : undefined,
    discount_code: typeof deal.discount_code === 'string' ? deal.discount_code : undefined,
    city: typeof deal.city === 'string' ? deal.city : undefined,
    image_url: typeof deal.image_url === 'string' ? deal.image_url : undefined,
  };
}

export default function PartnerDealsSection() {
  const { t } = useLanguage();

  const { data: deals = [] } = useQuery({
    queryKey: ['partner-deals'],
    queryFn: async () => {
      const activeDeals = await entities.PartnerDeal.filter({ is_active: true }, '-created_date', 6);
      return activeDeals.map(toPartnerDeal);
    },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {t('Exclusive Partner Offers', 'عروض حصرية من شركائنا')}
            </span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">
            {t('Deals & Discounts for Members', 'خصومات وعروض للأعضاء')}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {t('Special offers from our trusted partner network', 'عروض خاصة من شبكة شركائنا الموثوقين')}
          </p>
        </div>
        <Link href="/partners" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all shrink-0">
          {t('All Partners', 'جميع الشركاء')} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {deals.map((deal, i) => (
          <motion.div
            key={deal.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
          >
            <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 group h-full flex flex-col">
              <div className="relative h-36 overflow-hidden">
                <img
                  src={deal.image_url || PARTNER_IMAGES[deal.partner_type] || PARTNER_IMAGES.other}
                  alt={deal.partner_name || deal.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 left-3">
                  <Badge className="bg-primary text-primary-foreground text-xs font-bold border-0 shadow">
                    {deal.discount_label || 'Special Offer'}
                  </Badge>
                </div>
                {deal.city && (
                  <div className="absolute bottom-2 right-3 text-white/80 text-xs">{deal.city}</div>
                )}
              </div>

              <div className="p-4 flex flex-col flex-1">
                <p className="text-xs font-semibold text-primary mb-1">{deal.partner_name}</p>
                <h3 className="font-semibold text-foreground text-sm mb-1.5">{deal.title}</h3>
                <p className="text-xs text-muted-foreground flex-1 line-clamp-2 mb-3">{deal.description}</p>

                {deal.discount_code && (
                  <div className="flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-xl px-3 py-2">
                    <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">{t('Code:', 'الكود:')}</span>
                    <span className="text-xs font-bold text-primary tracking-widest">{deal.discount_code}</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}