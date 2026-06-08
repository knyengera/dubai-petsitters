"use client";

import { base44 } from "@/lib/data";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import StartChatButton from '@/components/messaging/StartChatButton';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, Globe, Clock, AlertCircle, ArrowLeft, CheckCircle, ExternalLink, Loader2, CalendarDays, MessageCircle, Send } from 'lucide-react';
import PhotoGallery from '@/components/common/PhotoGallery';
import ReviewsList from '@/components/reviews/ReviewsList';
import AppointmentBookingModal from '@/components/vets/AppointmentBookingModal';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const VET_IMAGES = [
  'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=1200&q=85',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1200&q=85',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=1200&q=85',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&q=85',
];

export default function VetDetail() {
  const { id } = useParams();
  const router = useRouter();

  const [showBooking, setShowBooking] = useState(false);

  const { data: clinic, isLoading } = useQuery({
    queryKey: ['vet', id],
    queryFn: () => entities.VetClinic.get(id),
    enabled: !!id,
  });

  const { data: subscription } = useQuery({
    queryKey: ['vetSubscription', clinic?.id],
    queryFn: () => entities.VetSubscription.filter({ clinic_id: clinic?.id, status: 'active' }, '-updated_date', 1).then(results => results[0] || null),
    enabled: !!clinic?.id,
  });

  const handleMessage = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        base44.auth.redirectToLogin();
        return;
      }
      const conversations = await entities.Conversation.filter({
        owner_email: user.email,
        contact_id: clinic.id,
        contact_type: 'vet'
      });
      let conversation = conversations[0];
      if (!conversation) {
        conversation = await entities.Conversation.create({
          owner_email: user.email,
          owner_name: user.full_name,
          contact_id: clinic.id,
          contact_name: clinic.name,
          contact_type: 'vet',
          contact_email: clinic.email || 'admin@' + clinic.name.toLowerCase().replace(/\s+/g, ''),
          subject: `Inquiry about ${clinic.name}`,
        });
      }
      router.push('/messages');
      toast.success('Chat opened!');
    } catch (error) {
      toast.error('Failed to open chat');
    }
  };

  const handleWhatsApp = () => {
    if (clinic.phone) {
      const phoneNumber = clinic.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneNumber}?text=Hello, I'd like to inquire about your services`, '_blank');
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }
  if (!clinic) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Clinic not found.</p></div>;
  }

  const galleryPhotos = [clinic.image_url, ...(clinic.gallery || [])].filter(Boolean);
  const fallbackPhotos = galleryPhotos.length > 0 ? galleryPhotos : VET_IMAGES.slice(0, 4);
  const mapQuery = encodeURIComponent([clinic.name, clinic.address, clinic.city, 'Saudi Arabia'].filter(Boolean).join(', '));

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-3 flex items-center justify-between">
        <Link href="/vets">
          <Button variant="outline" size="sm" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        {clinic.emergency_available && (
          <Badge className="bg-destructive text-white border-0 shadow">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> 24/7 Emergency
          </Badge>
        )}
      </div>

      {/* Header info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="font-heading text-3xl lg:text-4xl font-extrabold text-foreground mb-1">{clinic.name}</h1>
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{clinic.city}{clinic.address ? `, ${clinic.address}` : ''}</span>
          {clinic.rating && <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-rating text-rating" />{clinic.rating}</span>}
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <PhotoGallery photos={fallbackPhotos} name={clinic.name} />
      </div>

      {/* Main layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT */}
          <div className="flex-1 space-y-8">
            {/* Quick info */}
            <div className="flex flex-wrap gap-3">
              {clinic.phone && (
                <a href={`tel:${clinic.phone}`} className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-medium hover:border-primary hover:text-primary transition-colors">
                  <Phone className="w-4 h-4 text-primary" />{clinic.phone}
                </a>
              )}
              {clinic.opening_hours && (
                <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-2.5 text-sm">
                  <Clock className="w-4 h-4 text-primary" />{clinic.opening_hours}
                </div>
              )}
              {clinic.website && (
                <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors">
                  <Globe className="w-4 h-4" /> Visit Website
                </a>
              )}
            </div>

            {/* Rating */}
            {clinic.rating && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">Rating</h2>
                <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-5">
                  <div className="text-4xl font-extrabold text-primary font-heading">{clinic.rating}</div>
                  <div>
                    <div className="flex items-center gap-0.5 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.round(clinic.rating) ? 'fill-rating text-rating' : 'text-muted'}`} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">Based on patient reviews</p>
                  </div>
                </div>
              </section>
            )}

            {/* Services */}
            {clinic.services?.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {clinic.services.map(s => (
                    <Badge key={s} variant="secondary" className="px-3 py-1.5 text-sm capitalize">{s}</Badge>
                  ))}
                </div>
              </section>
            )}

            {/* Specialties */}
            {clinic.specialties?.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">Specialties</h2>
                <div className="flex flex-wrap gap-2">
                  {clinic.specialties.map(s => (
                    <div key={s} className="flex items-center gap-1.5 bg-primary/10 text-primary rounded-xl px-3 py-1.5 text-sm font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />{s}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <section>
              <h2 className="font-heading text-xl font-bold text-foreground mb-4">Reviews</h2>
              <ReviewsList targetId={clinic.id} targetType="vet" targetName={clinic.name} />
            </section>

            {/* Map */}
            <section>
              <h2 className="font-heading text-xl font-bold text-foreground mb-3">Location</h2>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow">
                <div className="h-72">
                  <iframe
                    title="Clinic location map"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&zoom=15`}
                  />
                </div>
                <div className="p-3 flex items-center justify-between border-t border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{clinic.city}{clinic.address ? `, ${clinic.address}` : ''}</p>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-medium flex items-center gap-1 hover:underline">
                    Open in Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </section>
            </div>

            {/* RIGHT — Contact + Map */}
          <div className="lg:w-96 space-y-5">
            {/* Contact card */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg lg:sticky lg:top-24 space-y-3">
              <h2 className="font-heading text-lg font-bold text-foreground">Contact the Clinic</h2>
              {subscription && (
               <Button onClick={() => setShowBooking(true)} className="w-full rounded-xl h-11 font-bold">
                 <CalendarDays className="w-4 h-4 mr-2" /> Book Appointment
               </Button>
              )}
              {clinic.phone && (
                <a href={`tel:${clinic.phone}`} className="block">
                  <Button className="w-full rounded-xl bg-primary h-11 font-bold">
                    <Phone className="w-4 h-4 mr-2" /> Call Now
                  </Button>
                </a>
              )}
              <Button variant="outline" onClick={handleMessage} className="w-full rounded-xl h-11">
                <MessageCircle className="w-4 h-4 mr-2" /> Message
              </Button>
              {clinic.phone && (
                <Button variant="outline" onClick={handleWhatsApp} className="w-full rounded-xl h-11">
                  <Send className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
              )}
              {clinic.website && (
               <a href={clinic.website} target="_blank" rel="noopener noreferrer" className="block">
                 <Button variant="outline" className="w-full rounded-xl h-11">
                   <Globe className="w-4 h-4 mr-2" /> Visit Website
                 </Button>
               </a>
              )}
              {clinic.opening_hours && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span>{clinic.opening_hours}</span>
                </div>
              )}
              {clinic.emergency_available && (
                <div className="flex items-center gap-2 text-sm font-medium text-destructive bg-destructive/10 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4" /> 24/7 Emergency care available
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <AppointmentBookingModal clinic={clinic} open={showBooking} onClose={() => setShowBooking(false)} />
    </div>
  );
}