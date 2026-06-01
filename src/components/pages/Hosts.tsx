"use client";

import React, { useState, useMemo } from 'react';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import HostCard from '@/components/hosts/HostCard';
import HostDetailModal from '@/components/hosts/HostDetailModal';
import { Home, Loader2 } from 'lucide-react';
import PullToRefresh from '@/components/common/PullToRefresh';
import HostFilters, { DEFAULT_HOST_FILTERS, applyHostFilters } from '@/components/filters/HostFilters';



export default function Hosts() {
  const [filters, setFilters] = useState(DEFAULT_HOST_FILTERS);
  const [selectedHost, setSelectedHost] = useState(null);

  const { data: hosts = [], isLoading, refetch } = useQuery({
    queryKey: ['pet-hosts'],
    queryFn: () => entities.PetHost.list('-rating'),
    initialData: [],
  });

  const filtered = useMemo(() => applyHostFilters(hosts, filters), [hosts, filters]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <Home className="w-8 h-8 text-primary" />
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">Find a Pet Host</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Browse trusted pet sitters and hosts across Saudi Arabia. Book the perfect care for your pet — just like Airbnb.
            </p>
          </motion.div>
        </div>
      </div>

      <PullToRefresh onRefresh={refetch}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <HostFilters filters={filters} onChange={setFilters} />

        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-6">
            {filtered.length} host{filtered.length !== 1 ? 's' : ''} found
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No hosts found</h3>
            <p className="text-muted-foreground">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((host, i) => (
              <motion.div key={host.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <HostCard host={host} onSelect={setSelectedHost} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      </PullToRefresh>
      <HostDetailModal
        host={selectedHost}
        open={!!selectedHost}
        onClose={() => setSelectedHost(null)}
      />
    </div>
  );
}