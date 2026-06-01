"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PawPrint, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CTASection() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 opacity-10">
            <PawPrint className="w-32 h-32 text-primary-foreground" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-10">
            <PawPrint className="w-24 h-24 text-primary-foreground rotate-12" />
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-foreground mb-4 relative">
            Ready to Make a Difference?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto mb-8 relative">
            Whether you're looking to adopt, need a pet sitter, or want to find the best vet — we're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
            <Link href="/adopt">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-xl px-8 font-semibold">
                Adopt a Pet
              </Button>
            </Link>
            <Link href="/hosting">
              <Button size="lg" variant="outline" className="border-white/30 text-primary-foreground hover:bg-white/10 rounded-xl px-8 font-semibold">
                Find a Sitter <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}