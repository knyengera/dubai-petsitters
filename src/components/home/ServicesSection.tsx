"use client";

import React from 'react';
import Link from 'next/link';
import { Heart, Home, Stethoscope, BookOpen, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const services = [
  {
    icon: Heart,
    title: 'Pet Adoption',
    description: 'Find your perfect furry companion from our verified adoption listings across the UAE.',
    link: '/adopt',
    color: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    icon: Home,
    title: 'Pet Hosting',
    description: 'Trusted pet boarding, daycare, and home sitting services when you need them most.',
    link: '/hosting',
    color: 'bg-info-muted text-info border-info-border',
  },
  {
    icon: Stethoscope,
    title: 'Vet Directory',
    description: 'Access a comprehensive directory of veterinary clinics and emergency services.',
    link: '/vets',
    color: 'bg-success-muted text-success border-success-border',
  },
  {
    icon: BookOpen,
    title: 'Pet Blog',
    description: 'Expert tips on pet care, health, training, and lifestyle in the UAE climate.',
    link: '/blog',
    color: 'bg-warning-muted text-warning border-warning-border',
  },
];

export default function ServicesSection() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Everything Your Pet Needs
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From adoption to daily care, we're building the most comprehensive pet care ecosystem in the UAE.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={service.link} className="group block h-full">
                <div className="h-full bg-card rounded-2xl border border-border p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${service.color} mb-5`}>
                    <service.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">{service.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">{service.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}