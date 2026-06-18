"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Heart, Shield, Eye } from 'lucide-react';
import { getSpeciesFallback } from '@/components/adopt/pet-images';

export default function PetCard({ pet, onAdopt, onView }) {
  const speciesFallback = useMemo(() => getSpeciesFallback(pet), [pet]);
  const storedUrl =
    pet.image_url && String(pet.image_url).trim().length > 0
      ? String(pet.image_url).trim()
      : null;
  const [imageUrl, setImageUrl] = useState(storedUrl ?? speciesFallback);

  useEffect(() => {
    setImageUrl(storedUrl ?? speciesFallback);
  }, [pet.id, storedUrl, speciesFallback]);

  const available = pet.status === 'available';

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={pet.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={() => {
            if (imageUrl !== speciesFallback) setImageUrl(speciesFallback);
          }}
        />
        <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground capitalize">
          {pet.species}
        </Badge>
        {pet.status === 'pending' && (
          <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
            Adoption Pending
          </Badge>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-foreground text-lg">{pet.name}</h3>
          <span className="text-sm text-muted-foreground capitalize">{pet.gender}</span>
        </div>
        {pet.breed && <p className="text-sm text-muted-foreground mb-2">{pet.breed}</p>}
        <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
          {pet.age && <span>{pet.age}</span>}
          {pet.size && <span className="capitalize">• {pet.size}</span>}
        </div>
        <div className="flex items-center gap-3 mb-3">
          {pet.vaccinated && (
            <div className="flex items-center gap-1 text-xs text-success">
              <Shield className="w-3.5 h-3.5" /> Vaccinated
            </div>
          )}
          {pet.location && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" /> {pet.location}
            </div>
          )}
        </div>
        {pet.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {pet.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onView?.(pet)}
            className="flex-1 rounded-xl gap-1.5"
          >
            <Eye className="w-4 h-4" /> Details
          </Button>
          <Button
            onClick={() => onAdopt(pet)}
            className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
            disabled={!available}
          >
            <Heart className="w-4 h-4 mr-1.5" />
            {available ? 'Adopt' : 'N/A'}
          </Button>
        </div>
      </div>
    </div>
  );
}
