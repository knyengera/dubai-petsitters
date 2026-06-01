"use client";

import { base44 } from "@/lib/data";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Clock, Star, AlertCircle, Globe, Sparkles, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { entities } from '@/lib/data/entities';
import { toast } from 'sonner';

const VET_IMAGES = [
  'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&q=80',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80',
  'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&q=80',
  'https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&q=80',
];

export default function VetCard({ clinic, index = 0 }) {
  const router = useRouter();
  const bgImage = clinic.image_url || VET_IMAGES[index % VET_IMAGES.length];

  const handleMessage = async (e) => {
    e.preventDefault();
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

  const handleWhatsApp = (e) => {
    e.preventDefault();
    if (clinic.phone) {
      const phoneNumber = clinic.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneNumber}?text=Hello, I'd like to inquire about your services`, '_blank');
    }
  };

  return (
    <Link href={`/vets/${clinic.id}`} className="block group">
      <div className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-card border border-border h-full">
        {/* Background image header */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={bgImage}
            alt={clinic.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {clinic.is_featured && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-amber-500 text-white border-0 shadow-lg text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Sponsored
              </Badge>
            </div>
          )}
          {clinic.emergency_available && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-destructive text-white border-0 shadow-lg text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                24/7 Emergency
              </Badge>
            </div>
          )}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="font-heading font-bold text-white text-lg leading-tight drop-shadow">{clinic.name}</h3>
            <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
              <MapPin className="w-3 h-3" />
              {clinic.city}{clinic.address ? `, ${clinic.address}` : ''}
            </div>
          </div>
        </div>

        {/* Card body */}
        <div className="p-4">
          {clinic.rating && (
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${i < Math.round(clinic.rating) ? 'text-amber-400 fill-amber-400' : 'text-muted'}`}
                />
              ))}
              <span className="text-sm text-muted-foreground ml-1">{clinic.rating}</span>
            </div>
          )}

          {clinic.services && clinic.services.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {clinic.services.slice(0, 3).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs font-normal">{s}</Badge>
              ))}
              {clinic.services.length > 3 && (
                <Badge variant="secondary" className="text-xs font-normal">+{clinic.services.length - 3}</Badge>
              )}
            </div>
          )}

          {clinic.opening_hours && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Clock className="w-3.5 h-3.5" />
              {clinic.opening_hours}
            </div>
          )}

          <div className="flex gap-2" onClick={e => e.preventDefault()}>
            <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs" onClick={handleMessage}>
              <MessageCircle className="w-3.5 h-3.5 mr-1.5" />Message
            </Button>
            {clinic.phone && (
              <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs" onClick={handleWhatsApp}>
                <Send className="w-3.5 h-3.5 mr-1.5" />WhatsApp
              </Button>
            )}
            {clinic.website && (
              <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs" asChild>
                <a href={clinic.website} target="_blank" rel="noopener noreferrer"><Globe className="w-3.5 h-3.5 mr-1.5" />Website</a>
              </Button>
            )}
            {clinic.phone && !clinic.website && (
              <Button variant="outline" size="sm" className="rounded-xl flex-1 text-xs" asChild>
                <a href={`tel:${clinic.phone}`}><Phone className="w-3.5 h-3.5 mr-1.5" />Call</a>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}