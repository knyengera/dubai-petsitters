"use client";

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Clock, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEFAULT_CURRENCY } from '@/lib/monetisation/constants';

const serviceLabels = {
  boarding: 'Boarding',
  daycare: 'Daycare',
  home_sitting: 'Home Sitting',
  dog_walking: 'Dog Walking',
};

export default function HostCard({ host, onSelect }) {
  const isRealHost = host.id && !String(host.id).startsWith('h');
  const inner = (
    <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer h-full" onClick={() => !isRealHost && onSelect && onSelect(host)}>
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        {host.photo_url ? (
          <img src={host.photo_url} alt={host.full_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-muted-foreground/30">
            {host.full_name?.[0]}
          </div>
        )}
        {host.is_featured && (
          <div className="absolute top-3 left-3 bg-warning text-warning-foreground text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Featured
          </div>
        )}
        {!host.is_featured && host.is_available && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Available
          </div>
        )}
        {!host.is_featured && !host.is_available && null}
        {host.is_featured && host.is_available && (
          <div className="absolute top-10 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Available
          </div>
        )}
        {host.rating && (
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm text-foreground text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 shadow">
            <Star className="w-3 h-3 fill-rating text-rating" />
            {host.rating} {host.review_count ? `(${host.review_count})` : ''}
          </div>
        )}
      </div>

      <div className="p-5">
      <div className="flex items-start justify-between mb-1.5">
        <h3 className="font-semibold text-foreground text-lg">{host.full_name}</h3>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        {host.neighborhood ? `${host.neighborhood}, ` : ''}{host.city}
      </div>

      {host.bio && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{host.bio}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {host.services?.map(s => (
          <Badge key={s} variant="secondary" className="text-xs font-normal">{serviceLabels[s] || s}</Badge>
        ))}
        {host.has_yard && <Badge variant="secondary" className="text-xs font-normal">🌿 Yard</Badge>}
      </div>

      <div className="flex items-center justify-between">
        <div>
          {host.price_per_night && (
            <span className="font-bold text-foreground">{DEFAULT_CURRENCY} {host.price_per_night}<span className="text-sm font-normal text-muted-foreground"> / night</span></span>
          )}
          {!host.price_per_night && host.price_per_day && (
            <span className="font-bold text-foreground">{DEFAULT_CURRENCY} {host.price_per_day}<span className="text-sm font-normal text-muted-foreground"> / day</span></span>
          )}
        </div>
        {host.response_time && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {host.response_time}
          </span>
        )}
      </div>
      </div>
      </div>
      );

      if (isRealHost) {
      return <Link href={`/hosts/${host.id}`} className="block h-full">{inner}</Link>;
      }
      return inner;
      }