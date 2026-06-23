"use client";

import React, { useState, useEffect, useCallback } from 'react';
import PaymentModal from '@/components/payment/PaymentModal';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Star, MapPin, Clock, CheckCircle, ArrowLeft, Home, Sun, Dog, Footprints, Loader2, ExternalLink } from 'lucide-react';
import PhotoGallery from '@/components/common/PhotoGallery';
import StartChatButton from '@/components/messaging/StartChatButton';
import ReviewsList from '@/components/reviews/ReviewsList';
import BookingPetField, { isBookingPetValid, type BookingPetValue } from '@/components/hosting/BookingPetField';
import BookingDatePicker from '@/components/hosting/BookingDatePicker';
import { isRangeBookable } from '@/lib/hosting/availability';
import { useHostBookingCalendar } from '@/lib/hosting/use-host-booking-calendar';
import { createHostingBookingWithEscrow } from '@/lib/monetisation/actions';
import { DEFAULT_CURRENCY } from '@/lib/monetisation/constants';
import { quoteToSummary } from '@/lib/monetisation/pricing';
import { useHostingBookingQuote } from '@/lib/monetisation/use-booking-quote';
import { useAuth } from '@/lib/auth-context';
import {
  saveHostBookingDraft,
  loadHostBookingDraft,
  clearHostBookingDraft,
} from '@/lib/hosting/booking-draft';

const serviceLabels = {
  boarding: 'Boarding', daycare: 'Daycare',
  home_sitting: 'Home Sitting', dog_walking: 'Dog Walking',
};

const serviceIcons = { boarding: Home, daycare: Sun, home_sitting: Dog, dog_walking: Footprints };

const emptyPet: BookingPetValue = {
  mode: 'new',
  petName: '',
  petType: '',
};

export default function HostDetail() {
  const { id } = useParams();
  const hostId = String(id || '');
  const { toast } = useToast();
  const { user, navigateToLogin, isLoadingAuth } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    service_type: '',
    start_date: '',
    end_date: '',
    pet: emptyPet,
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

  useEffect(() => {
    if (isLoadingAuth || !hostId) return;
    const draft = loadHostBookingDraft(hostId);
    if (!draft) return;
    setForm({
      service_type: draft.service_type,
      start_date: draft.start_date,
      end_date: draft.end_date,
      pet: draft.pet,
    });
    clearHostBookingDraft(hostId);
  }, [isLoadingAuth, hostId]);

  const { data: bookingCalendar } = useHostBookingCalendar(host?.id, !!host?.id);

  const { quote, loading: quoteLoading, error: quoteError } = useHostingBookingQuote({
    hostId: host?.id,
    serviceType: form.service_type,
    startDate: form.start_date,
    endDate: form.end_date,
    enabled: !!host?.id,
  });

  const handlePetChange = useCallback((pet: BookingPetValue) => {
    setForm((f) => ({ ...f, pet }));
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host) return;

    if (!user) {
      saveHostBookingDraft({
        hostId: host.id,
        service_type: form.service_type,
        start_date: form.start_date,
        end_date: form.end_date,
        pet: form.pet,
      });
      navigateToLogin();
      return;
    }

    if (!quote) {
      toast({ title: 'Unable to quote', description: quoteError || 'Check booking details.', variant: 'destructive' });
      return;
    }
    if (!isRangeBookable(bookingCalendar, form.start_date, form.end_date)) {
      toast({ title: 'Dates unavailable', description: 'Please select dates that are open on the calendar.', variant: 'destructive' });
      return;
    }
    setShowPayment(true);
  };

  const handlePayConfirm = async (gateway: string) => {
    if (!host || !user?.email) return { paymentId: '' };

    setLoading(true);

    const petName = form.pet.petName.trim();
    const petType = form.pet.petType;

    if (form.pet.mode === 'new') {
      try {
        const existingPets = await entities.UserPet.list('-created_date', 50);
        const duplicate = existingPets.some(
          (p) =>
            String(p.name || '').toLowerCase() === petName.toLowerCase() &&
            String(p.species || '').toLowerCase() === petType.toLowerCase()
        );
        if (!duplicate) {
          await entities.UserPet.create({
            name: petName,
            species: petType,
            created_by: user.email,
          });
          queryClient.invalidateQueries({ queryKey: ['my-pets'] });
        }
      } catch {
        // Non-blocking: booking can proceed even if pet save fails
      }
    }

    const result = await createHostingBookingWithEscrow({
      hostId: host.id,
      serviceType: form.service_type,
      startDate: form.start_date,
      endDate: form.end_date || null,
      petName,
      petType,
      city: host.city,
      paymentProvider: gateway,
      idempotencyKey: crypto.randomUUID(),
    });
    if (result.ok === false) {
      setLoading(false);
      const description =
        result.error === 'Complete your profile before booking.'
          ? 'Please complete your profile before requesting a booking.'
          : result.error;
      toast({ title: 'Booking failed', description, variant: 'destructive' });
      throw new Error(result.error);
    }
    const id = String(result.data.booking.id);
    const paymentId = String(result.data.payment.id);
    setBookingId(id);
    setLoading(false);
    if (window.gtag) {
      window.gtag('event', 'booking_request', {
        host_id: host.id, host_name: host.full_name,
        host_city: host.city, service_type: form.service_type,
        platform_fee: quote?.guest_fee_amount, gateway,
      });
    }
    return { paymentId };
  };

  const handlePaymentComplete = () => {
    toast({ title: 'Booking submitted!', description: 'We will confirm your payment shortly.' });
    setShowPayment(false);
    setBooked(true);
  };

  const petValid = isBookingPetValid(form.pet);

  const datesBookable = isRangeBookable(bookingCalendar, form.start_date, form.end_date);
  const canSubmit =
    !!form.service_type &&
    !!form.start_date &&
    datesBookable &&
    petValid &&
    (user ? !!quote && !quoteLoading : true);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!host) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Host not found.</p></div>;
  }

  const galleryPhotos = [host.photo_url, ...(host.gallery || [])].filter(Boolean);
  const mapQuery = encodeURIComponent([host.neighborhood, host.city, 'UAE'].filter(Boolean).join(', '));
  const paymentSummary = quote
    ? quoteToSummary(quote, `Booking with ${host.full_name}`)
    : { title: `Booking with ${host.full_name}`, lines: [], total: '—' };
  const acceptedPetTypes = Array.isArray(host.accepted_pet_types)
    ? (host.accepted_pet_types as string[])
    : [];

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
          {host.rating && <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-rating text-rating" />{host.rating} ({host.review_count || 0} reviews)</span>}
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
            {acceptedPetTypes.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">Accepted Pet Types</h2>
                <div className="flex flex-wrap gap-2">
                  {acceptedPetTypes.map(t => (
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

            {/* RIGHT — Booking */}
          <div className="lg:w-96 space-y-5">
            {/* Booking card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg lg:sticky lg:top-24">
              <div className="flex items-center justify-between mb-5">
                <div>
                  {host.price_per_night && <p className="font-heading text-2xl font-bold text-foreground">{DEFAULT_CURRENCY} {host.price_per_night}<span className="text-sm font-normal text-muted-foreground"> / night</span></p>}
                  {!host.price_per_night && host.price_per_day && <p className="font-heading text-2xl font-bold text-foreground">{DEFAULT_CURRENCY} {host.price_per_day}<span className="text-sm font-normal text-muted-foreground"> / day</span></p>}
                </div>
                {host.rating && (
                  <div className="flex items-center gap-1 text-sm font-semibold">
                    <Star className="w-4 h-4 fill-rating text-rating" />{host.rating}
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
                  <BookingDatePicker
                    hostId={host.id}
                    startDate={form.start_date}
                    endDate={form.end_date}
                    onRangeChange={(start_date, end_date) => setForm(f => ({ ...f, start_date, end_date }))}
                    compact
                  />

                  <BookingPetField
                    acceptedPetTypes={acceptedPetTypes}
                    value={form.pet}
                    onChange={handlePetChange}
                    disabled={loading}
                  />

                  {/* Fee preview — server-authoritative (logged-in only) */}
                  {user && quoteLoading && form.service_type && form.start_date && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Calculating price...
                    </div>
                  )}
                  {user && quoteError && (
                    <div className="text-xs text-destructive bg-destructive/10 rounded-xl p-2">{quoteError}</div>
                  )}
                  {user && quote && (
                    <div className="bg-secondary rounded-xl p-3 text-xs space-y-1">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Service ({quote.units} unit{quote.units !== 1 ? 's' : ''})</span>
                        <span>{quote.currency} {quote.base_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Platform fee ({quote.guest_service_fee_pct}%)</span>
                        <span>{quote.currency} {quote.guest_fee_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-foreground border-t border-border pt-1">
                        <span>Total due now</span>
                        <span>{quote.currency} {quote.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  <StartChatButton
                    contactId={host.id}
                    contactName={host.full_name}
                    contactType="host"
                    contactEmail={host.created_by}
                    subject={`Question about hosting with ${host.full_name}`}
                    className="w-full h-10"
                  />
                   <Button type="submit" className="w-full rounded-xl bg-primary h-11 font-bold" disabled={loading || !canSubmit}>
                     {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                     {user ? 'Request & Pay' : 'Login & Request'}
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
        summary={paymentSummary}
        onConfirm={handlePayConfirm}
        onComplete={handlePaymentComplete}
      />
    </div>
  );
}
