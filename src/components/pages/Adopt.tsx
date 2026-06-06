"use client";

import React, { useState, useMemo } from 'react';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import PetFilters from '@/components/adopt/PetFilters';
import PetCard from '@/components/adopt/PetCard';
import AdoptionModal from '@/components/adopt/AdoptionModal';
import { PawPrint, Loader2 } from 'lucide-react';
import PullToRefresh from '@/components/common/PullToRefresh';

export default function Adopt() {
  const [filters, setFilters] = useState({ search: '', species: 'all', gender: 'all', size: 'all' });
  const [selectedPet, setSelectedPet] = useState(null);

  const { data: pets = [], isLoading, refetch } = useQuery({
    queryKey: ['pets'],
    queryFn: () => entities.Pet.filter({ status: 'available' }, '-created_date'),
  });

  const filteredPets = useMemo(() => {
    return pets.filter(pet => {
      if (pet.status === 'adopted') return false;
      if (filters.species !== 'all' && pet.species !== filters.species) return false;
      if (filters.gender !== 'all' && pet.gender !== filters.gender) return false;
      if (filters.size !== 'all' && pet.size !== filters.size) return false;
      if (filters.search && !pet.name?.toLowerCase().includes(filters.search.toLowerCase()) && !pet.breed?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [pets, filters]);

  return (
    <div className="min-h-screen bg-background">
      <PullToRefresh onRefresh={refetch}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <PetFilters filters={filters} setFilters={setFilters} />
          </div>

          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredPets.length === 0 ? (
              <div className="text-center py-20">
                <PawPrint className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No pets found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPets.map((pet, i) => (
                  <motion.div
                    key={pet.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <PetCard pet={pet} onAdopt={setSelectedPet} />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      </PullToRefresh>
      <AdoptionModal
        pet={selectedPet}
        open={!!selectedPet}
        onClose={() => setSelectedPet(null)}
      />
    </div>
  );
}