"use client";

import { useState } from 'react';
import Link from 'next/link';
import { entities } from '@/lib/data/entities';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Stethoscope, CheckCircle, Star, Megaphone, Calendar } from 'lucide-react';
import PaymentModal from '@/components/payment/PaymentModal';

const ANNUAL_FEE = 999; // SAR
const SAUDI_CITIES = ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha', 'Other'];

const PERKS = [
  { icon: Star, text: 'Featured listing in our Vets directory' },
  { icon: Megaphone, text: 'Post unlimited specials & discounts' },
  { icon: CheckCircle, text: 'Verified badge on your clinic profile' },
  { icon: Calendar, text: '12 months of active promotion' },
];

export default function VetAdvertise() {
  const { user, isLoadingAuth, navigateToLogin } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState({
    clinic_name: '', contact_name: '', contact_email: '', contact_phone: '',
    city: '', address: '', specialties: '', promo_title: '', promo_description: '',
  });
  const [showPayment, setShowPayment] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to submit your clinic advertising application.',
        variant: 'destructive',
      });
      navigateToLogin();
      return;
    }
    setSubmitting(true);
    try {
      const sub = await entities.VetSubscription.create({
        ...form,
        contact_email: user.email,
        specialties: form.specialties.split(',').map((s) => s.trim()).filter(Boolean),
        plan: 'annual',
        amount_paid: ANNUAL_FEE,
        amount: ANNUAL_FEE,
        status: 'pending_payment',
        created_by: user.email,
      });
      setSubscriptionId(sub.id as string);
      setShowPayment(true);
    } catch (err) {
      toast({
        title: 'Submission failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayConfirm = async (gateway: string) => {
    if (!subscriptionId) return;
    try {
      const payment = await entities.Payment.create({
        payment_type: 'vet_subscription',
        gateway,
        amount: ANNUAL_FEE,
        currency: 'SAR',
        status: 'pending',
        reference_id: subscriptionId,
        payer_name: form.contact_name,
        payer_email: user?.email ?? form.contact_email,
      });
      const today = new Date();
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);
      await entities.VetSubscription.update(subscriptionId, {
        gateway,
        payment_id: payment.id,
        status: 'pending_payment',
        start_date: today.toISOString().split('T')[0],
        end_date: nextYear.toISOString().split('T')[0],
      });
    } catch (err) {
      toast({
        title: 'Payment setup failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const paymentSummary = {
    title: `Vet Clinic Annual Subscription — ${form.clinic_name || 'Your Clinic'}`,
    lines: [
      { label: 'Annual listing fee', value: `SAR ${ANNUAL_FEE}` },
      { label: 'Duration', value: '12 months' },
      { label: 'VAT (15%)', value: `SAR ${(ANNUAL_FEE * 0.15).toFixed(2)}` },
    ],
    total: `SAR ${(ANNUAL_FEE * 1.15).toFixed(2)}`,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/vets">
          <Button variant="outline" size="sm" className="rounded-xl mb-6">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Vets
          </Button>
        </Link>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left — Benefits */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Stethoscope className="w-7 h-7 text-primary" />
              </div>
              <p className="text-muted-foreground leading-relaxed">Reach thousands of pet owners across Saudi Arabia. List your clinic, post specials, and grow your practice.</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <p className="font-heading font-bold text-foreground text-lg">What's Included</p>
              {PERKS.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm text-foreground">{text}</p>
                </div>
              ))}
            </div>

            <div className="bg-primary rounded-2xl p-5 text-primary-foreground text-center">
              <p className="text-sm font-medium opacity-80 mb-1">Annual Plan</p>
              <p className="font-heading text-4xl font-extrabold">SAR {ANNUAL_FEE}</p>
              <p className="text-sm opacity-80 mt-1">+ 15% VAT / year</p>
            </div>
          </div>

          {/* Right — Form */}
          <div className="lg:col-span-3">
            {!isLoadingAuth && !user ? (
              <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
                <p className="text-muted-foreground">Sign in to advertise your clinic and proceed to payment.</p>
                <Button type="button" onClick={navigateToLogin} className="rounded-xl">
                  Sign In to Continue
                </Button>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="font-heading text-xl font-bold text-foreground mb-2">Clinic Details</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label className="text-xs">Clinic Name *</Label><Input required value={form.clinic_name} onChange={f('clinic_name')} className="rounded-xl mt-1" /></div>
                <div>
                  <Label className="text-xs">City *</Label>
                  <select required value={form.city} onChange={f('city')} className="mt-1 w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="">Select city</option>
                    {SAUDI_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={f('address')} className="rounded-xl mt-1" /></div>
              <div><Label className="text-xs">Specialties (comma separated)</Label><Input value={form.specialties} onChange={f('specialties')} placeholder="e.g. Small animals, Exotic pets, Surgery" className="rounded-xl mt-1" /></div>

              <hr className="border-border" />
              <h2 className="font-heading text-xl font-bold text-foreground">Contact Person</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label className="text-xs">Full Name *</Label><Input required value={form.contact_name} onChange={f('contact_name')} className="rounded-xl mt-1" /></div>
                <div><Label className="text-xs">Email *</Label><Input required type="email" value={user?.email ?? form.contact_email} onChange={f('contact_email')} disabled={!!user?.email} className="rounded-xl mt-1" /></div>
              </div>
              <div><Label className="text-xs">Phone</Label><Input value={form.contact_phone} onChange={f('contact_phone')} className="rounded-xl mt-1" /></div>

              <hr className="border-border" />
              <h2 className="font-heading text-xl font-bold text-foreground">Promotion / Special Offer</h2>
              <div><Label className="text-xs">Promo Headline</Label><Input value={form.promo_title} onChange={f('promo_title')} placeholder="e.g. 20% off first checkup this month!" className="rounded-xl mt-1" /></div>
              <div><Label className="text-xs">Promo Details</Label><Textarea value={form.promo_description} onChange={f('promo_description')} rows={3} placeholder="Describe your offer, terms & conditions..." className="rounded-xl mt-1 text-sm" /></div>

              <Button type="submit" disabled={submitting || isLoadingAuth} className="w-full rounded-xl h-11 font-bold bg-primary">
                {submitting ? 'Saving...' : `Proceed to Payment — SAR ${(ANNUAL_FEE * 1.15).toFixed(2)}`}
              </Button>
            </form>
            )}
          </div>
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        summary={paymentSummary}
        onConfirm={handlePayConfirm}
      />
    </div>
  );
}