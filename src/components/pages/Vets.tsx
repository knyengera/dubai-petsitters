"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import VetCard from '@/components/vets/VetCard';
import VetFilters, { DEFAULT_VET_FILTERS, applyVetFilters } from '@/components/filters/VetFilters';
import { Stethoscope, Loader2, Megaphone } from 'lucide-react';

const CITIES = ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Madinah', 'Khobar', 'Tabuk', 'Abha'];

export default function Vets() {
  const [filters, setFilters] = useState(DEFAULT_VET_FILTERS);

  const { data: clinics, isLoading } = useQuery({
    queryKey: ['vet-clinics'],
    queryFn: () => entities.VetClinic.list('-rating'),
    initialData: [],
  });

  const filtered = useMemo(() => applyVetFilters(clinics, filters), [clinics, filters]);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <Stethoscope className="w-8 h-8 text-primary" />
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">Find a Vet</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Browse veterinary clinics across Saudi Arabia. Find emergency services, specialists, and routine care near you.
            </p>
            <Link href="/vet-advertise" className="inline-block mt-5">
              <Button className="rounded-xl gap-2 font-semibold">
                <Megaphone className="w-4 h-4" /> Advertise Your Clinic
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
              <motion.div key={clinic.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <VetCard clinic={clinic} index={i} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}