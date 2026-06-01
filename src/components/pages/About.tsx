"use client";

import React from 'react';
import { Heart, Shield, Users } from 'lucide-react';

const values = [
  { icon: Heart, title: 'Compassion First', desc: 'Every decision we make is guided by the well-being of animals and the people who love them.' },
  { icon: Shield, title: 'Trust & Safety', desc: 'All hosts and vet listings are reviewed to ensure a safe, reliable experience for every pet family.' },
  { icon: Users, title: 'Community Driven', desc: 'Built by Saudi pet lovers, for Saudi pet lovers — a community that genuinely cares.' },
];

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Mission */}
        <section>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed text-base">
            Saudi Petsitters was founded with a simple mission: to make pet care in Saudi Arabia easier, safer, and more accessible. 
            Whether you're looking for a trusted host to care for your pet while you travel, a reputable veterinary clinic, or a loving 
            home for an animal in need — we're here to help every step of the way.
          </p>
        </section>

        {/* Values */}
        <section>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-6">Our Values</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {values.map(v => (
              <div key={v.title} className="bg-card border border-border rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed text-base">
            Founded in Riyadh, Saudi Petsitters grew out of a personal frustration: finding reliable, caring pet services in the Kingdom 
            was unnecessarily difficult. Our founders — passionate pet owners themselves — set out to build a platform that solves this 
            problem for every family in Saudi Arabia. Today, we connect thousands of pet owners with vetted hosts, certified vet clinics, 
            adoption centers, and a thriving community of fellow animal lovers.
          </p>
        </section>

        {/* Contact */}
        <section className="bg-card border border-border rounded-2xl p-8 text-center">
          <h2 className="font-heading text-xl font-bold text-foreground mb-2">Get in Touch</h2>
          <p className="text-muted-foreground mb-4">Have questions or want to partner with us?</p>
          <a href="mailto:hello@saudipetsitters.com" className="text-primary font-semibold hover:underline">
            hello@saudipetsitters.com
          </a>
        </section>
      </div>
    </div>
  );
}