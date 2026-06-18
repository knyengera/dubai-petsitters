"use client";

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { Tag, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import DealCard, { toPartnerDeal } from '@/components/deals/DealCard';

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
        <Link href="/deals" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all shrink-0">
          {t('All Deals', 'جميع العروض')} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {deals.map((deal, i) => (
          <DealCard key={deal.id} deal={deal} index={i} />
        ))}
      </div>
    </div>
  );
}
