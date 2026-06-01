"use client";

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { Tag, ChevronRight, ExternalLink } from 'lucide-react';
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

const SAMPLE_DEALS = [
  { id: 'd1', title: '20% Off Annual Vet Checkup', description: 'Book your pet\'s annual health checkup and get 20% off at any of our partner clinics in Riyadh.', partner_name: 'Al Hayat Vet Clinics', partner_type: 'vet_clinic', discount_label: '20% OFF', discount_code: 'PETSITTER20', city: 'Riyadh', is_active: true },
  { id: 'd2', title: 'Free Grooming Session', description: 'New customers get a complimentary full grooming session for dogs up to 10kg.', partner_name: 'PawSpa Grooming', partner_type: 'grooming', discount_label: 'FREE Session', discount_code: 'FIRSTPAW', city: 'Jeddah', is_active: true },
  { id: 'd3', title: '15% Off Premium Pet Food', description: 'Exclusive discount on Royal Canin and Hills Science Diet for Saudi Petsitters members.', partner_name: 'PetMart KSA', partner_type: 'food', discount_label: '15% OFF', discount_code: 'PETMART15', city: 'All Cities', is_active: true },
];

export default function PartnerDealsSection() {
  const { t } = useLanguage();

  const { data: deals = [] } = useQuery({
    queryKey: ['partner-deals'],
    queryFn: () => entities.PartnerDeal.filter({ is_active: true }, '-created_date', 6),
    initialData: [],
  });

  const displayDeals = deals.length > 0 ? deals : SAMPLE_DEALS;

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
        {displayDeals.map((deal, i) => (
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
                  alt={deal.partner_name}
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