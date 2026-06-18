"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSpeciesFallback } from '@/components/adopt/pet-images';

function FeaturedPetImage({ pet }) {
  const fallback = getSpeciesFallback(pet);
  const [src, setSrc] = React.useState(
    pet.image_url && String(pet.image_url).trim().length > 0
      ? String(pet.image_url).trim()
      : fallback
  );
  return (
    <img
      src={src}
      alt={pet.name}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}

export default function FeaturedPets({ pets }) {
  if (!pets || pets.length === 0) return null;

  return (
    <section className="py-20 lg:py-28 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4"
        >
          <div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Pets Looking for a Home
            </h2>
            <p className="text-muted-foreground text-lg">
              These lovely animals are waiting for their forever family.
            </p>
          </div>
          <Link href="/adopt">
            <Button variant="outline" className="rounded-xl">
              View All Pets <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.slice(0, 6).map((pet, i) => (
            <motion.div
              key={pet.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/adopt/${pet.id}`} className="group block">
                <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300">
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <FeaturedPetImage pet={pet} />
                    <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground capitalize">
                      {pet.species}
                    </Badge>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground text-lg">{pet.name}</h3>
                      <span className="text-sm text-muted-foreground">{pet.age}</span>
                    </div>
                    {pet.breed && <p className="text-sm text-muted-foreground mb-2">{pet.breed}</p>}
                    {pet.location && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5" />
                        {pet.location}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}