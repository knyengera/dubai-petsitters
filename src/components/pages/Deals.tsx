"use client";

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tag, Loader2 } from 'lucide-react';
import { entities } from '@/lib/data/entities';
import { useLanguage } from '@/lib/language-context';
import DealCard, { toPartnerDeal } from '@/components/deals/DealCard';

export default function Deals() {
  const { t } = useLanguage();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['partner-deals', 'all'],
    queryFn: async () => {
      const activeDeals = await entities.PartnerDeal.filter({ is_active: true }, '-created_date');
      return activeDeals.map(toPartnerDeal);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-5 h-5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {t('Exclusive Partner Offers', 'عروض حصرية من شركائنا')}
            </span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {t('Deals & Discounts for Members', 'خصومات وعروض للأعضاء')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('Special offers from our trusted partner network', 'عروض خاصة من شبكة شركائنا الموثوقين')}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('No deals available', 'لا توجد عروض متاحة')}
            </h3>
            <p className="text-muted-foreground">
              {t('Check back soon for new partner offers.', 'تحقق قريبًا للحصول على عروض جديدة من شركائنا.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {deals.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
