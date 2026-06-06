"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import VetCard from '@/components/vets/VetCard';
import VetFilters, { DEFAULT_VET_FILTERS, applyVetFilters } from '@/components/filters/VetFilters';
import { Stethoscope, Loader2, Megaphone } from 'lucide-react';

export default function Vets() {
  const [filters, setFilters] = useState(DEFAULT_VET_FILTERS);

  const { data: clinics = [], isLoading } = useQuery({
    queryKey: ['vet-clinics'],
    queryFn: () => entities.VetClinic.filter({ is_approved: true }, '-rating'),
  });

  const filtered = useMemo(() => applyVetFilters(clinics, filters), [clinics, filters]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/vet-advertise" className="inline-block mb-6">
          <Button className="rounded-xl gap-2 font-semibold">
            <Megaphone className="w-4 h-4" /> Advertise Your Clinic
          </Button>
        </Link>
        <VetFilters filters={filters} onChange={setFilters} />
        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-6">{filtered.length} clinic{filtered.length !== 1 ? 's' : ''} found</p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Stethoscope className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No clinics found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((clinic, i) => (
              <div key={clinic.id}>
                <VetCard clinic={clinic} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}