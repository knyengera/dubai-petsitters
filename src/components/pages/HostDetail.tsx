"use client";

import React, { useState, useEffect } from 'react';
import PaymentModal from '@/components/payment/PaymentModal';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Star, MapPin, Clock, CheckCircle, ArrowLeft, Home, Sun, Dog, Footprints, Loader2, ExternalLink } from 'lucide-react';
import PhotoGallery from '@/components/common/PhotoGallery';
import StartChatButton from '@/components/messaging/StartChatButton';
import ReviewsList from '@/components/reviews/ReviewsList';

const serviceLabels = {
  boarding: 'Boarding', daycare: 'Daycare',
  home_sitting: 'Home Sitting', dog_walking: 'Dog Walking',
};

const serviceIcons = { boarding: Home, daycare: Sun, home_sitting: Dog, dog_walking: Footprints };

export default function HostDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [form, setForm] = useState({
    pet_name: '', pet_type: '', service_type: '', start_date: '', end_date: '',
    owner_name: '', owner_email: '', owner_phone: '', special_instructions: '',
  });

  const { data: host, isLoading } = useQuery({
    queryKey: ['host', id],
    queryFn: () => entities.PetHost.get(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (host && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: `Host: ${host.full_name}`,
        page_location: window.location.href,
        host_id: host.id,
        host_city: host.city,
      });
    }
  }, [host]);

  const calcFee = () => {
    if (!host) return { base: 0, fee: 0, total: 0 };
    const pricePerUnit = host.price_per_night || host.price_per_day || 0;
    let nights = 1;
    if (form.start_date && form.end_date) {
      const diff = (new Date(form.end_date) - new Date(form.start_date)) / (1000 * 60 * 60 * 24);
      nights = Math.max(1, diff);
    }
    const base = pricePerUnit * nights;
    const fee = parseFloat((base * 0.1).toFixed(2));
    const total = parseFloat((base + fee).toFixed(2));
    return { base, fee, total, nights };
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setPendingBooking({ ...form });
    setShowPayment(true);
  };

  const handlePayConfirm = async (gateway) => {
    const { base, fee, total } = calcFee();
    setLoading(true);
    const booking = await entities.HostingBooking.create({
      ...pendingBooking,
      host_id: host.id, host_name: host.full_name, city: host.city,
      quoted_price: base,
      platform_fee: fee,
      total_price: total,
      payment_status: 'fee_paid',
    });
    await entities.Payment.create({
      payment_type: 'booking_fee',
      gateway,
      amount: fee,
      currency: 'SAR',
      status: 'pending',
      reference_id: booking.id,
      payer_name: pendingBooking.owner_name,
      payer_email: pendingBooking.owner_email,
    });
    if (window.gtag) {
      window.gtag('event', 'booking_request', {
        host_id: host.id, host_name: host.full_name,
        host_city: host.city, service_type: pendingBooking.service_type,
        platform_fee: fee, gateway,
      });
    }
    toast({ title: 'Booking Requested!', description: `Your request to stay with ${host.full_name} has been sent.` });
    setLoading(false);
    setBooked(true);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!host) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Host not found.</p></div>;
  }

  const galleryPhotos = [host.photo_url, ...(host.gallery || [])].filter(Boolean);
  const { base, fee, total, nights } = calcFee();
  const mapQuery = encodeURIComponent([host.neighborhood, host.city, 'Saudi Arabia'].filter(Boolean).join(', '));

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-3 flex items-center justify-between">
        <Link href="/hosts">
          <Button variant="outline" size="sm" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        {host.is_available && (
          <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Available
          </div>
        )}
      </div>

      {/* Header info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="font-heading text-3xl lg:text-4xl font-extrabold text-foreground mb-1">{host.full_name}</h1>
        <div className="flex items-center gap-3 text-muted-foreground text-sm">
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{host.neighborhood ? `${host.neighborhood}, ` : ''}{host.city}</span>
          {host.rating && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{host.rating} ({host.review_count || 0} reviews)</span>}
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <PhotoGallery photos={galleryPhotos} name={host.full_name} />
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT — Details */}
          <div className="flex-1 space-y-8">
            {/* Services */}
            <section>
              <h2 className="font-heading text-xl font-bold text-foreground mb-4">Services Offered</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {host.services?.map(s => {
                  const Icon = serviceIcons[s] || Home;
                  return (
                    <div key={s} className="flex flex-col items-center gap-2 p-4 bg-card border border-border rounded-2xl text-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{serviceLabels[s] || s}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* About */}
            {host.bio && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">About {host.full_name}</h2>
                <p className="text-muted-foreground leading-relaxed">{host.bio}</p>
              </section>
            )}

            {/* Details grid */}
            <section>
              <h2 className="font-heading text-xl font-bold text-foreground mb-4">Host Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {host.has_yard && <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl text-sm"><CheckCircle className="w-4 h-4 text-primary" />Has a yard</div>}
                {host.non_smoking && <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl text-sm"><CheckCircle className="w-4 h-4 text-primary" />Non-smoking</div>}
                {host.max_pets && <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl text-sm"><CheckCircle className="w-4 h-4 text-primary" />Up to {host.max_pets} pets</div>}
                {host.response_time && <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl text-sm"><Clock className="w-4 h-4 text-primary" />Responds in {host.response_time}</div>}
                {host.languages?.length > 0 && <div className="flex items-center gap-2 p-3 bg-card border border-border rounded-xl text-sm col-span-2"><CheckCircle className="w-4 h-4 text-primary" />Speaks: {host.languages.join(', ')}</div>}
              </div>
            </section>

            {/* Accepted pets */}
            {host.accepted_pet_types?.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">Accepted Pet Types</h2>
                <div className="flex flex-wrap gap-2">
                  {host.accepted_pet_types.map(t => (
                    <Badge key={t} variant="secondary" className="capitalize px-3 py-1 text-sm">{t}</Badge>
                  ))}
                </div>
              </section>
            )}



            {/* Reviews */}
            <section>
              <h2 className="font-heading text-xl font-bold text-foreground mb-4">Reviews</h2>
              <ReviewsList targetId={host.id} targetType="host" targetName={host.full_name} />
            </section>

            {/* Map */}
            <section>
              <h2 className="font-heading text-xl font-bold text-foreground mb-3">Location</h2>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow">
                <div className="h-72">
                  <iframe
                    title="Host location map"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&zoom=13`}
                  />
                </div>
                <div className="p-3 flex items-center justify-between border-t border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{host.neighborhood ? `${host.neighborhood}, ` : ''}{host.city}</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-medium flex items-center gap-1 hover:underline">
                    Open in Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </section>
            </div>

            {/* RIGHT — Booking + Map */}
          <div className="lg:w-96 space-y-5">
            {/* Booking card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-5">
                <div>
                  {host.price_per_night && <p className="font-heading text-2xl font-bold text-foreground">SAR {host.price_per_night}<span className="text-sm font-normal text-muted-foreground"> / night</span></p>}
                  {!host.price_per_night && host.price_per_day && <p className="font-heading text-2xl font-bold text-foreground">SAR {host.price_per_day}<span className="text-sm font-normal text-muted-foreground"> / day</span></p>}
                </div>
                {host.rating && (
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />{host.rating}
                  </div>
                )}
              </div>

              {booked ? (
                <div className="text-center py-4">
                  <CheckCircle className="w-10 h-10 text-primary mx-auto mb-2" />
                  <p className="font-semibold text-foreground">Booking Sent!</p>
                  <p className="text-sm text-muted-foreground">We will confirm your booking shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleBook} className="space-y-3">
                  <div>
                    <Label className="text-xs">Service *</Label>
                    <Select value={form.service_type} onValueChange={v => setForm(f => ({ ...f, service_type: v }))}>
                      <SelectTrigger className="rounded-xl mt-1 h-10 text-sm"><SelectValue placeholder="Select service" /></SelectTrigger>
                      <SelectContent>
                        {host.services?.map(s => <SelectItem key={s} value={s}>{serviceLabels[s] || s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Start Date *</Label><Input required type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="rounded-xl mt-1 h-10 text-sm" /></div>
                    <div><Label className="text-xs">End Date</Label><Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className="rounded-xl mt-1 h-10 text-sm" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><Label className="text-xs">Pet Name *</Label><Input required value={form.pet_name} onChange={e => setForm(f => ({ ...f, pet_name: e.target.value }))} className="rounded-xl mt-1 h-10 text-sm" /></div>
                    <div>
                      <Label className="text-xs">Pet Type *</Label>
                      <Select value={form.pet_type} onValueChange={v => setForm(f => ({ ...f, pet_type: v }))}>
                        <SelectTrigger className="rounded-xl mt-1 h-10 text-sm"><SelectValue placeholder="Type" /></SelectTrigger>
                        <SelectContent>{['dog','cat','bird','rabbit','fish','reptile','other'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label className="text-xs">Your Name *</Label><Input required value={form.owner_name} onChange={e => setForm(f => ({ ...f, owner_name: e.target.value }))} className="rounded-xl mt-1 h-10 text-sm" /></div>
                  <div><Label className="text-xs">Email *</Label><Input required type="email" value={form.owner_email} onChange={e => setForm(f => ({ ...f, owner_email: e.target.value }))} className="rounded-xl mt-1 h-10 text-sm" /></div>
                  <div><Label className="text-xs">Phone</Label><Input value={form.owner_phone} onChange={e => setForm(f => ({ ...f, owner_phone: e.target.value }))} className="rounded-xl mt-1 h-10 text-sm" /></div>
                  <div><Label className="text-xs">Notes</Label><Textarea value={form.special_instructions} onChange={e => setForm(f => ({ ...f, special_instructions: e.target.value }))} className="rounded-xl mt-1 text-sm" rows={2} /></div>

                  {/* Fee preview */}
                  {(host.price_per_night || host.price_per_day) && base > 0 && (
                    <div className="bg-secondary rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between text-muted-foreground"><span>Service ({nights} {host.price_per_night ? 'night(s)' : 'day(s)'})</span><span>SAR {base}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Platform fee (10%)</span><span>SAR {fee}</span></div>
                      <div className="flex justify-between font-bold text-foreground border-t border-border pt-1"><span>Total</span><span>SAR {total}</span></div>
                    </div>
                  )}

                  <StartChatButton
                    contactId={host.id}
                    contactName={host.full_name}
                    contactType="host"
                    subject={`Question about hosting with ${host.full_name}`}
                    className="w-full h-10"
                  />
                   <Button type="submit" className="w-full rounded-xl bg-primary h-11 font-bold" disabled={loading || !form.service_type || !form.pet_type || !form.start_date}>
                     {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                     Request & Pay
                   </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        open={showPayment}
        onClose={() => setShowPayment(false)}
        summary={{
          title: `Booking with ${host.full_name}`,
          lines: [
            { label: `Service (${nights} ${host.price_per_night ? 'night(s)' : 'day(s)'})`, value: `SAR ${base}` },
            { label: 'Platform fee (10%)', value: `SAR ${fee}` },
          ],
          total: `SAR ${total}`,
        }}
        onConfirm={handlePayConfirm}
      />
    </div>
  );
}