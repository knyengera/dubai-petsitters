"use client";

import React, { useState } from 'react';
import { entities } from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, Stethoscope, Store, TrendingUp, Megaphone, Globe, BadgeCheck, Loader2, ChevronRight } from 'lucide-react';
import AdvertisePaymentModal from '@/components/partners/AdvertisePaymentModal';

const partnerTypes = [
  { icon: Stethoscope, label: 'Vet Clinics', desc: 'Reach thousands of pet owners looking for trusted care.' },
  { icon: Store, label: 'Pet Shops & Stores', desc: 'Promote your products to an engaged Saudi audience.' },
  { icon: TrendingUp, label: 'Pet Insurance', desc: 'Connect with owners seeking protection for their pets.' },
  { icon: Globe, label: 'Other Pet Businesses', desc: 'Groomers, trainers, breeders & more.' },
];

const adPlans = [
  {
    name: 'Starter',
    price: 'SAR 299',
    period: '/month',
    color: 'border-border',
    features: ['Directory listing', 'Business profile page', 'Contact button', '500 impressions/month'],
  },
  {
    name: 'Professional',
    price: 'SAR 799',
    period: '/month',
    color: 'border-primary',
    badge: 'Most Popular',
    features: ['Everything in Starter', 'Featured placement', 'Banner ad on relevant pages', '5,000 impressions/month', 'Monthly analytics report'],
  },
  {
    name: 'Premium',
    price: 'SAR 1,999',
    period: '/month',
    color: 'border-warning',
    features: ['Everything in Professional', 'Homepage spotlight', 'Priority search ranking', 'Unlimited impressions', 'Dedicated account manager', 'Custom landing page'],
  },
];

const stats = [
  { num: '12,000+', label: 'Active Pet Owners' },
  { num: '350+', label: 'Vet Connections' },
  { num: '15', label: 'Saudi Cities' },
  { num: '4.9★', label: 'Platform Rating' },
];

export default function Partners() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: '', contact_name: '', email: '', phone: '',
    business_type: '', city: '', website: '', message: '', plan: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await entities.PartnerInquiry.create({
        business_name: form.business_name,
        business_type: form.business_type,
        contact_name: form.contact_name,
        email: form.email,
        phone: form.phone || null,
        city: form.city,
        website: form.website || null,
        plan: form.plan || null,
        message: form.message || null,
        status: 'new',
      });
      toast({ title: 'Inquiry Sent!', description: 'Our partnerships team will contact you within 48 hours.' });
      setSubmitted(true);
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground mb-3">Inquiry Received!</h2>
          <p className="text-muted-foreground mb-6">Thank you for your interest in partnering with Saudi Petsitters. Our team will reach out within 48 hours to discuss the best options for your business.</p>
          <Button onClick={() => setSubmitted(false)} className="rounded-xl bg-primary">Submit Another Inquiry</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Stats bar */}
      <div className="bg-primary text-primary-foreground py-6">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <div className="font-heading text-2xl font-extrabold">{s.num}</div>
              <div className="text-sm text-primary-foreground/80">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* Who we serve */}
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Who Can Partner With Us?</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">We welcome all pet-related businesses looking to grow their customer base in Saudi Arabia.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {partnerTypes.map((p, i) => (
            <motion.div key={p.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <div className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <p.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground mb-1">{p.label}</h3>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Pricing */}
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-2">Advertising Plans</h2>
          <p className="text-muted-foreground">Flexible options to fit every business size and budget.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {adPlans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className={`relative bg-card border-2 ${plan.color} rounded-2xl p-6 h-full flex flex-col ${plan.badge ? 'shadow-xl' : ''}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow">{plan.badge}</span>
                  </div>
                )}
                <div className="mb-4">
                  <h3 className="font-heading text-xl font-bold text-foreground">{plan.name}</h3>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="font-heading text-3xl font-extrabold text-primary">{plan.price}</span>
                    <span className="text-sm text-muted-foreground mb-1">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => {
                    setSelectedPlan(plan);
                    setForm((f) => ({ ...f, plan: plan.name }));
                  }}
                  className={`w-full rounded-xl ${plan.badge ? 'bg-primary text-primary-foreground' : 'variant-outline'}`}
                  variant={plan.badge ? 'default' : 'outline'}
                >
                  Get Started <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Contact Form */}
        <div id="partner-form" className="max-w-2xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2 text-center">Get In Touch</h2>
          <p className="text-muted-foreground text-center mb-8">Tell us about your business and we'll find the best advertising solution for you.</p>

          <form onSubmit={handleSubmit} className="space-y-5 bg-card border border-border rounded-2xl p-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Business Name *</Label>
                <Input required value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} className="rounded-xl mt-1" placeholder="Your clinic / shop name" />
              </div>
              <div>
                <Label>Business Type *</Label>
                <Input required value={form.business_type} onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. Vet Clinic" />
              </div>
              <div>
                <Label>Contact Name *</Label>
                <Input required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>City *</Label>
                <Input required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. Riyadh" />
              </div>
              <div className="col-span-2">
                <Label>Website</Label>
                <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} className="rounded-xl mt-1" placeholder="https://" />
              </div>
            </div>
            {form.plan && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2 text-sm text-primary font-medium">
                Selected Plan: <strong>{form.plan}</strong>
              </div>
            )}
            <div>
              <Label>Message</Label>
              <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className="rounded-xl mt-1" placeholder="Tell us about your advertising goals and target audience..." />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl bg-primary h-12 font-bold text-base">
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Megaphone className="w-5 h-5 mr-2" />}
              Send Partnership Inquiry
            </Button>
          </form>
        </div>
      </div>

      <AdvertisePaymentModal plan={selectedPlan} open={!!selectedPlan} onClose={() => setSelectedPlan(null)} />
    </div>
  );
}