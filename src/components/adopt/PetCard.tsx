"use client";

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Heart, Shield } from 'lucide-react';

const petImageFallbacks = {
  dog: [
    'https://images.unsplash.com/photo-1633722715463-d30628519b21?w=600&h=450&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534227572793-a440d8a6d3ca?w=600&h=450&fit=crop&q=80',
    'https://images.unsplash.com/photo-1572826595617-d2a27c9ad6a3?w=600&h=450&fit=crop&q=80',
    'https://images.unsplash.com/photo-1577720643272-265f434f0c41?w=600&h=450&fit=crop&q=80',
  ],
  cat: [
    'https://images.unsplash.com/photo-1574158622682-e40ad94f3009?w=600&h=450&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=600&h=450&fit=crop&q=80',
    'https://images.unsplash.com/photo-1513360371669-4a0eb3e4fedd?w=600&h=450&fit=crop&q=80',
    'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600&h=450&fit=crop&q=80',
  ],
  bird: [
    'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=450&fit=crop&q=80',
    'https://images.unsplash.com/photo-1444464666175-1642a9ff1990?w=600&h=450&fit=crop&q=80',
  ],
  rabbit: [
    'https://images.unsplash.com/photo-1585110396000-c9ffd4d4b3f0?w=600&h=450&fit=crop&q=80',
    'https://images.unsplash.com/photo-1585229677926-3a54f8f3ce10?w=600&h=450&fit=crop&q=80',
  ],
  fish: [
    'https://images.unsplash.com/photo-1597804212624-27e4e32a6399?w=600&h=450&fit=crop&q=80',
  ],
  reptile: [
    'https://images.unsplash.com/photo-1531090882048-57f09fcded24?w=600&h=450&fit=crop&q=80',
  ],
  other: [
    'https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=600&h=450&fit=crop&q=80',
  ],
};

const getImageUrl = (pet) => {
  if (pet.image_url) return pet.image_url;
  const speciesFallbacks = petImageFallbacks[pet.species] || petImageFallbacks.other;
  return speciesFallbacks[Math.floor(Math.random() * speciesFallbacks.length)];
};

export default function PetCard({ pet, onAdopt }) {
  const imageUrl = getImageUrl(pet);
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 group">
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        <img src={imageUrl} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground capitalize">
          {pet.species}
        </Badge>
        {pet.status === 'pending' && (
          <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
            Adoption Pending
          </Badge>
        )}
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-foreground text-lg">{pet.name}</h3>
          <span className="text-sm text-muted-foreground capitalize">{pet.gender}</span>
        </div>
        {pet.breed && <p className="text-sm text-muted-foreground mb-2">{pet.breed}</p>}
        <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
          {pet.age && <span>{pet.age}</span>}
          {pet.size && <span className="capitalize">• {pet.size}</span>}
        </div>
        <div className="flex items-center gap-3 mb-4">
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
        <Button
          onClick={() => onAdopt(pet)}
          className="w-full rounded-xl bg-primary hover:bg-primary/90"
          disabled={pet.status !== 'available'}
        >
          <Heart className="w-4 h-4 mr-2" />
          {pet.status === 'available' ? 'Adopt Me' : 'Not Available'}
        </Button>
      </div>
    </div>
  );
}