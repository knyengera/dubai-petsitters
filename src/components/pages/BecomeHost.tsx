"use client";

import React, { useState } from 'react';
import { entities } from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/auth-context';
import { uploadAppFile } from '@/lib/storage/upload';
import Link from 'next/link';
import { CheckCircle, Upload, Home, Sun, Dog, Footprints, Star, Users, DollarSign, Shield, Loader2, CalendarDays } from 'lucide-react';
import { DEFAULT_CURRENCY } from '@/lib/monetisation/constants';

const perks = [
  { icon: DollarSign, title: 'Earn Extra Income', desc: 'Set your own rates and earn on your schedule.' },
  { icon: Users, title: 'Meet Fellow Pet Lovers', desc: 'Join a community of passionate animal caregivers.' },
  { icon: Shield, title: 'Full Insurance Coverage', desc: 'Every booking is protected by our care guarantee.' },
  { icon: Star, title: 'Build Your Reputation', desc: 'Collect reviews and grow your hosting profile.' },
];

const serviceOptions = [
  { id: 'boarding', icon: Home, label: 'Pet Boarding' },
  { id: 'daycare', icon: Sun, label: 'Daycare' },
  { id: 'home_sitting', icon: Dog, label: 'Home Sitting' },
  { id: 'dog_walking', icon: Footprints, label: 'Dog Walking' },
];

export default function BecomeHost() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [form, setForm] = useState({
    full_name: '', bio: '', city: '', neighborhood: '',
    price_per_night: '', price_per_day: '',
    languages: '', accepted_pet_types: '',
    has_yard: false, non_smoking: true,
  });

  const toggleService = (id) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      toast({ title: 'Please select at least one service', variant: 'destructive' });
      return;
    }
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to submit a host application.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      let photo_url = null;
      if (photoFile) {
        photo_url = await uploadAppFile("public-uploads", photoFile, user.id, "hosts", "profile");
      }
      await entities.PetHost.create({
        ...form,
        photo_url,
        services: selectedServices,
        price_per_night: parseFloat(form.price_per_night) || null,
        price_per_day: parseFloat(form.price_per_day) || null,
        languages: form.languages ? form.languages.split(',').map(l => l.trim()) : [],
        accepted_pet_types: form.accepted_pet_types ? form.accepted_pet_types.split(',').map(p => p.trim()) : [],
        is_available: true,
        created_by: user.email,
        user_id: user.id,
      });
      toast({ title: 'Application submitted!' });
      setSubmitted(true);
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: err instanceof Error ? err.message : 'Could not submit application',
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
          <h2 className="font-heading text-3xl font-bold text-foreground mb-3">You are on your way!</h2>
          <p className="text-muted-foreground mb-6">Your host profile has been submitted. Block any dates you are unavailable so guests only see open days when booking.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/host-calendar">
              <Button className="rounded-xl bg-primary gap-2 w-full sm:w-auto">
                <CalendarDays className="w-4 h-4" />Set Your Availability
              </Button>
            </Link>
            <Button onClick={() => setSubmitted(false)} variant="outline" className="rounded-xl">Submit Another Profile</Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {perks.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <div className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <p.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Registration Form */}
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2 text-center">Create Your Host Profile</h2>
          <p className="text-muted-foreground text-center mb-8">Fill in your details below and start accepting bookings.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden bg-muted flex items-center justify-center">
                {photoPreview
                  ? <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  : <Upload className="w-8 h-8 text-muted-foreground" />
                }
              </div>
              <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                Upload Profile Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Full Name *</Label>
                <Input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} className="rounded-xl mt-1" placeholder="Your full name" />
              </div>
              <div>
                <Label>City *</Label>
                <Input required value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. Riyadh" />
              </div>
              <div>
                <Label>Neighborhood</Label>
                <Input value={form.neighborhood} onChange={e => setForm(f => ({ ...f, neighborhood: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. Al Olaya" />
              </div>
            </div>

            <div>
              <Label>About You *</Label>
              <Textarea required value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} className="rounded-xl mt-1 min-h-[100px]" placeholder="Tell pet owners about yourself — your experience, home environment, and love for animals..." />
            </div>

            {/* Services */}
            <div>
              <Label className="mb-3 block">Services You Offer *</Label>
              <div className="grid grid-cols-2 gap-3">
                {serviceOptions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleService(s.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      selectedServices.includes(s.id)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    <s.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price per Night ({DEFAULT_CURRENCY})</Label>
                <Input type="number" value={form.price_per_night} onChange={e => setForm(f => ({ ...f, price_per_night: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. 120" />
              </div>
              <div>
                <Label>Price per Day ({DEFAULT_CURRENCY})</Label>
                <Input type="number" value={form.price_per_day} onChange={e => setForm(f => ({ ...f, price_per_day: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. 80" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pet Types Accepted</Label>
                <Input value={form.accepted_pet_types} onChange={e => setForm(f => ({ ...f, accepted_pet_types: e.target.value }))} className="rounded-xl mt-1" placeholder="dog, cat, bird..." />
              </div>
              <div>
                <Label>Languages Spoken</Label>
                <Input value={form.languages} onChange={e => setForm(f => ({ ...f, languages: e.target.value }))} className="rounded-xl mt-1" placeholder="Arabic, English..." />
              </div>
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.has_yard} onChange={e => setForm(f => ({ ...f, has_yard: e.target.checked }))} className="w-4 h-4 accent-primary" />
                I have a yard / garden
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={form.non_smoking} onChange={e => setForm(f => ({ ...f, non_smoking: e.target.checked }))} className="w-4 h-4 accent-primary" />
                Non-smoking home
              </label>
            </div>

            <Button type="submit" disabled={loading} className="w-full rounded-xl bg-primary h-12 font-bold text-base">
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Submit My Host Profile
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}