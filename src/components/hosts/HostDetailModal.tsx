"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MapPin, CheckCircle, Clock, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createHostingBookingWithEscrow } from '@/lib/monetisation/actions';
import { DEFAULT_CURRENCY } from '@/lib/monetisation/constants';
import { quoteToSummary } from '@/lib/monetisation/pricing';
import { useHostingBookingQuote } from '@/lib/monetisation/use-booking-quote';
import PaymentModal from '@/components/payment/PaymentModal';

const serviceLabels = {
  boarding: 'Boarding',
  daycare: 'Daycare',
  home_sitting: 'Home Sitting',
  dog_walking: 'Dog Walking',
};

export default function HostDetailModal({ host, open, onClose }) {
  const [step, setStep] = useState('profile'); // profile | book
  const [form, setForm] = useState({
    pet_name: '', pet_type: '', service_type: '', start_date: '', end_date: '',
    owner_name: '', owner_email: '', owner_phone: '', city: host?.city || '', special_instructions: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const { toast } = useToast();

  const { quote, loading: quoteLoading, error: quoteError } = useHostingBookingQuote({
    hostId: host?.id,
    serviceType: form.service_type,
    startDate: form.start_date,
    endDate: form.end_date,
    enabled: open && step === 'book' && !!host,
  });

  const handleBook = async (e) => {
    e.preventDefault();
    if (!quote || !host) {
      toast({ title: 'Unable to quote', description: quoteError || 'Check booking details.', variant: 'destructive' });
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentConfirm = async (gateway: string) => {
    setLoading(true);
    const result = await createHostingBookingWithEscrow({
      hostId: host.id,
      serviceType: form.service_type,
      startDate: form.start_date,
      endDate: form.end_date || null,
      petName: form.pet_name,
      petType: form.pet_type,
      city: form.city || host.city || null,
      paymentProvider: gateway,
      idempotencyKey: crypto.randomUUID(),
    });
    if (result.ok === false) {
      setLoading(false);
      toast({ title: 'Booking failed', description: result.error, variant: 'destructive' });
      throw new Error(result.error);
    }
    const id = String(result.data.booking.id);
    const paymentId = String(result.data.payment.id);
    setBookingId(id);
    setLoading(false);
    return { paymentId };
  };

  const handlePaymentComplete = () => {
    toast({ title: 'Booking submitted!', description: `Your request to stay with ${host.full_name} was submitted.` });
    onClose();
    setStep('profile');
    setShowPayment(false);
  };

  if (!host) return null;

  return (
    <>
    <PaymentModal
      open={showPayment}
      onClose={() => setShowPayment(false)}
      summary={quote ? quoteToSummary(quote, `Booking with ${host.full_name}`) : { title: `Booking with ${host.full_name}`, lines: [], total: '—' }}
      onConfirm={handlePaymentConfirm}
      onComplete={handlePaymentComplete}
    />
    <Dialog open={open && !showPayment} onOpenChange={() => { onClose(); setStep('profile'); }}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        {step === 'profile' ? (
          <>
            <div className="aspect-[16/7] -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-xl">
              {host.photo_url ? (
                <img src={host.photo_url} alt={host.full_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-6xl font-bold text-muted-foreground/20">
                  {host.full_name?.[0]}
                </div>
              )}
            </div>

            <DialogHeader>
              <div className="flex items-start justify-between">
                <DialogTitle className="font-heading text-2xl">{host.full_name}</DialogTitle>
                {host.rating && (
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <Star className="w-4 h-4 fill-rating text-rating" />
                    {host.rating}
                    {host.review_count && <span className="text-muted-foreground font-normal">({host.review_count} reviews)</span>}
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                {host.neighborhood ? `${host.neighborhood}, ` : ''}{host.city}
                {host.response_time && (
                  <span className="ml-3 flex items-center gap-1"><Clock className="w-4 h-4" /> Responds in {host.response_time}</span>
                )}
              </div>

              {/* Map */}
              <div className="rounded-xl overflow-hidden border border-border h-44 relative">
                <iframe
                  title="Host location"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent([host.neighborhood, host.city, 'Saudi Arabia'].filter(Boolean).join(', '))}&output=embed&zoom=13`}
                />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([host.neighborhood, host.city, 'Saudi Arabia'].filter(Boolean).join(', '))}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 bg-white text-xs font-medium px-2.5 py-1 rounded-lg shadow flex items-center gap-1 hover:bg-primary hover:text-white transition-colors"
                >
                  <MapPin className="w-3 h-3" /> Open in Google Maps
                </a>
              </div>

              {host.bio && <p className="text-sm text-foreground leading-relaxed">{host.bio}</p>}

              <div>
                <p className="text-sm font-semibold mb-2">Services Offered</p>
                <div className="flex flex-wrap gap-2">
                  {host.services?.map(s => (
                    <Badge key={s} className="bg-primary/10 text-primary border-0">{serviceLabels[s] || s}</Badge>
                  ))}
                </div>
              </div>

              {host.accepted_pet_types?.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Accepts</p>
                  <div className="flex flex-wrap gap-2">
                    {host.accepted_pet_types.map(t => (
                      <Badge key={t} variant="secondary" className="capitalize">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4 py-3 border-t border-border text-sm">
                {host.has_yard && <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Has a yard</span>}
                {host.non_smoking && <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Non-smoking</span>}
                {host.max_pets && <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Up to {host.max_pets} pets</span>}
                {host.languages?.length > 0 && <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> {host.languages.join(', ')}</span>}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div>
                  {host.price_per_night && (
                    <span className="text-2xl font-bold text-foreground">{DEFAULT_CURRENCY} {host.price_per_night}<span className="text-sm font-normal text-muted-foreground"> / night</span></span>
                  )}
                  {!host.price_per_night && host.price_per_day && (
                    <span className="text-2xl font-bold text-foreground">{DEFAULT_CURRENCY} {host.price_per_day}<span className="text-sm font-normal text-muted-foreground"> / day</span></span>
                  )}
                </div>
                <Button onClick={() => setStep('book')} className="bg-primary hover:bg-primary/90 rounded-xl px-8">
                  Book Now
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <button onClick={() => setStep('profile')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-1">
                <ArrowLeft className="w-4 h-4" /> Back to profile
              </button>
              <DialogTitle className="font-heading text-xl">Book with {host.full_name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBook} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Pet Name *</Label>
                  <Input required value={form.pet_name} onChange={e => setForm(f => ({ ...f, pet_name: e.target.value }))} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label>Pet Type *</Label>
                  <Select value={form.pet_type} onValueChange={v => setForm(f => ({ ...f, pet_type: v }))}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other'].map(t => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Service *</Label>
                <Select value={form.service_type} onValueChange={v => setForm(f => ({ ...f, service_type: v }))}>
                  <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {host.services?.map(s => (
                      <SelectItem key={s} value={s}>{serviceLabels[s] || s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date *</Label>
                  <Input required type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="rounded-xl mt-1" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Your Name *</Label>
                  <Input required value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input required type="email" value={form.owner_email} onChange={e => setForm(f => ({ ...f, owner_email: e.target.value }))} className="rounded-xl mt-1" />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.owner_phone} onChange={e => setForm(f => ({ ...f, owner_phone: e.target.value }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Special Instructions</Label>
                <Textarea value={form.special_instructions} onChange={e => setForm(f => ({ ...f, special_instructions: e.target.value }))} placeholder="Diet, medication, special needs..." className="rounded-xl mt-1" rows={3} />
              </div>
              {quoteLoading && form.service_type && form.start_date && (
                <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Calculating price...</p>
              )}
              {quoteError && <p className="text-xs text-destructive">{quoteError}</p>}
              {quote && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-xs space-y-1">
                  <div className="flex justify-between"><span>Host price</span><span>{quote.currency} {quote.base_amount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-primary"><span>Platform fee ({quote.guest_service_fee_pct}%)</span><span>{quote.currency} {quote.guest_fee_amount.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold border-t border-border pt-1"><span>Total</span><span>{quote.currency} {quote.total_amount.toFixed(2)}</span></div>
                </div>
              )}
              <Button type="submit" className="w-full rounded-xl bg-primary hover:bg-primary/90 h-12" disabled={loading || quoteLoading || !quote || !form.service_type || !form.pet_type}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Confirm Booking
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}