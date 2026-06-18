"use client";

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tag, Loader2 } from 'lucide-react';
import { entities } from '@/lib/data/entities';
import { useLanguage } from '@/lib/language-context';
import DealCard, { toPartnerDeal } from '@/components/deals/DealCard';
import DealFilters, { DEFAULT_DEAL_FILTERS, applyDealFilters } from '@/components/filters/DealFilters';

export default function Deals() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState(DEFAULT_DEAL_FILTERS);

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['partner-deals', 'all'],
    queryFn: async () => {
      const activeDeals = await entities.PartnerDeal.filter({ is_active: true }, '-created_date');
      return activeDeals.map(toPartnerDeal);
    },
  });

  const filtered = useMemo(() => applyDealFilters(deals, filters), [deals, filters]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <DealFilters filters={filters} onChange={setFilters} />

        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-6">
            {filtered.length} {filtered.length === 1 ? t('deal', 'عرض') : t('deals', 'عروض')} {t('found', 'متاح')}
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t('No deals found', 'لا توجد عروض')}
            </h3>
            <p className="text-muted-foreground">
              {t('Try adjusting your search or filters.', 'حاول تعديل البحث أو عوامل التصفية.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((deal, i) => (
              <DealCard key={deal.id} deal={deal} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
