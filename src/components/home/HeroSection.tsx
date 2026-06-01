"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Heart, Search, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection({ heroImage }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Happy pets in a Saudi home"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-foreground/20" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-44">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-full px-4 py-1.5 mb-6">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Saudi Arabia's #1 Pet Care Platform</span>
          </div>

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Where Every Pet Finds{' '}
            <span className="text-primary">Love & Care</span>
          </h1>

          <p className="text-lg text-white/70 mb-10 max-w-lg leading-relaxed">
            Adopt your perfect companion, find trusted pet sitters, and access the best veterinary care across the Kingdom.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/adopt">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-13 text-base font-semibold shadow-lg shadow-primary/25">
                <Search className="w-5 h-5 mr-2" />
                Browse Pets
              </Button>
            </Link>
            <Link href="/hosting">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 h-13 text-base font-semibold backdrop-blur-sm">
                Book a Sitter
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}