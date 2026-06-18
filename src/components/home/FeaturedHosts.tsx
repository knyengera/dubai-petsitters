"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Star, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import HostDetailModal from '../hosts/HostDetailModal';
import { DEFAULT_CURRENCY } from '@/lib/monetisation/constants';
import { FALLBACK_IMAGE } from '@/lib/images';

const serviceLabels = {
  boarding: 'Boarding',
  daycare: 'Daycare',
  home_sitting: 'Home Sitting',
  dog_walking: 'Dog Walking',
};

function HostPreviewCard({ host, onSelect }) {
  return (
    <div
      onClick={() => onSelect(host)}
      className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
    >
      <div className="aspect-[3/2] relative overflow-hidden bg-muted">
        <img
          src={host.photo_url || FALLBACK_IMAGE}
          alt={host.full_name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(FALLBACK_IMAGE)) {
              e.currentTarget.src = FALLBACK_IMAGE;
            }
          }}
        />
        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-foreground text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
          <Star className="w-3 h-3 fill-rating text-rating" />
          {host.rating ?? '—'} {host.review_count ? `(${host.review_count})` : ''}
        </div>
        {host.is_available && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Available
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-foreground text-lg mb-1">{host.full_name}</h3>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {host.neighborhood ? `${host.neighborhood}, ` : ''}{host.city}
        </div>
        {host.bio && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{host.bio}</p>}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {host.services?.slice(0, 3).map(s => (
            <span key={s} className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">
              {serviceLabels[s] || s}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-foreground">
            {host.price_per_night ? (
              <>{DEFAULT_CURRENCY} {host.price_per_night} <span className="font-normal text-muted-foreground">/ night</span></>
            ) : host.price_per_day ? (
              <>{DEFAULT_CURRENCY} {host.price_per_day} <span className="font-normal text-muted-foreground">/ day</span></>
            ) : null}
          </div>
          <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 text-xs px-4">
            Book Now
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedHosts() {
  const [selectedHost, setSelectedHost] = useState(null);

  const { data: hosts } = useQuery({
    queryKey: ['featured-hosts'],
    queryFn: () => entities.PetHost.filter({ is_available: true }, '-rating', 6),
    initialData: [],
  });

  if (!hosts || hosts.length === 0) return null;

  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4"
        >
          <div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Top-Rated Pet Sitters
            </h2>
            <p className="text-muted-foreground text-lg">
              Trusted hosts across the Kingdom — browse profiles and book in minutes.
            </p>
          </div>
          <Link href="/hosts">
            <Button variant="outline" className="rounded-xl shrink-0">
              View All Hosts <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hosts.slice(0, 6).map((host, i) => (
            <motion.div
              key={host.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <HostPreviewCard host={host} onSelect={setSelectedHost} />
            </motion.div>
          ))}
        </div>
      </div>

      <HostDetailModal
        host={selectedHost}
        open={!!selectedHost}
        onClose={() => setSelectedHost(null)}
      />
    </section>
  );
}