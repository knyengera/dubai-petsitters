"use client";

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import DealCard, { toPartnerDeal } from '@/components/deals/DealCard';

export default function PartnerDealsSection() {
  const { t } = useLanguage();
  const sliderRef = React.useRef<HTMLDivElement>(null);

  const { data: deals = [] } = useQuery({
    queryKey: ['partner-deals'],
    queryFn: async () => {
      const activeDeals = await entities.PartnerDeal.filter({ is_active: true }, '-created_date', 8);
      return activeDeals.map(toPartnerDeal);
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

  if (deals.length === 0) return null;

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
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollSlider('previous')}
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition-all hover:bg-primary/8"
            aria-label={t('Previous deals', 'العروض السابقة')}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollSlider('next')}
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-sm transition-all hover:bg-primary/8"
            aria-label={t('Next deals', 'العروض التالية')}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <Link href="/deals" className="text-primary text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            {t('All Deals', 'جميع العروض')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div
        ref={sliderRef}
        className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [&::-webkit-scrollbar]:hidden"
      >
        {deals.map((deal, i) => (
          <div key={deal.id} className="w-[82%] shrink-0 snap-start sm:w-[calc(50%_-_0.625rem)] lg:w-[calc(33.333%_-_0.834rem)]">
            <DealCard deal={deal} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
