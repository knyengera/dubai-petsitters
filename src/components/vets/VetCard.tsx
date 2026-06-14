"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Phone,
  Clock,
  Star,
  AlertCircle,
  Globe,
  Sparkles,
  Send,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StartChatButton from "@/components/messaging/StartChatButton";

const VET_IMAGES = [
  "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600&q=80",
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80",
  "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80",
  "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&q=80",
  "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=600&q=80",
  "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=600&q=80",
];

type VetClinicCard = {
  id: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  is_featured?: boolean;
  emergency_available?: boolean;
  rating?: number;
  services?: string[];
  opening_hours?: string;
};

export default function VetCard({
  clinic,
  index = 0,
  variant = "default",
}: {
  clinic: VetClinicCard;
  index?: number;
  variant?: "default" | "trusted";
}) {
  const router = useRouter();
  const bgImage = clinic.image_url || VET_IMAGES[index % VET_IMAGES.length];

  const goToDetail = () => router.push(`/vets/${clinic.id}`);

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clinic.phone) {
      const phoneNumber = clinic.phone.replace(/\D/g, "");
      window.open(
        `https://wa.me/${phoneNumber}?text=Hello, I'd like to inquire about your services`,
        "_blank"
      );
    }
  };

  const handleWebsite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clinic.website) window.open(clinic.website, "_blank");
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (clinic.phone) window.location.href = `tel:${clinic.phone}`;
  };

  if (variant === "trusted") {
    return (
      <div
        role="link"
        tabIndex={0}
        onClick={goToDetail}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToDetail();
          }
        }}
        className="block h-full cursor-pointer overflow-hidden rounded-2xl border border-success-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative h-36 overflow-hidden">
          <img
            src={bgImage}
            alt={clinic.name}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-bold text-success-foreground">
            <BadgeCheck className="h-3 w-3" /> Verified
          </div>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="mb-1 truncate font-heading text-sm font-bold text-foreground">
            {clinic.name}
          </h3>
          {(clinic.city || clinic.address) && (
            <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {clinic.city}
                {clinic.address ? `${clinic.city ? ", " : ""}${clinic.address}` : ""}
              </span>
            </div>
          )}
          {clinic.services && clinic.services.length > 0 && (
            <div className="mt-auto flex flex-wrap gap-1">
              {clinic.services.slice(0, 3).map((service) => (
                <span
                  key={service}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {service}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <StartChatButton
              contactId={clinic.id}
              contactName={clinic.name}
              contactType="vet"
              contactEmail={clinic.email}
              subject={`Inquiry about ${clinic.name}`}
              stopPropagation
              size="sm"
              className="flex-1 rounded-xl text-xs"
            >
              Message
            </StartChatButton>
            {clinic.phone && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl text-xs"
                onClick={handleWhatsApp}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                WhatsApp
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToDetail();
        }
      }}
      className="block group cursor-pointer rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-card border border-border h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={bgImage}
          alt={clinic.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {clinic.is_featured && (
          <div className="absolute top-3 left-3">
            <Badge variant="warning" className="border-0 shadow-lg text-xs">
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
          <h3 className="font-heading font-bold text-white text-lg leading-tight drop-shadow">
            {clinic.name}
          </h3>
          <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
            <MapPin className="w-3 h-3" />
            {clinic.city}
            {clinic.address ? `, ${clinic.address}` : ""}
          </div>
        </div>
      </div>

      <div className="p-4">
        {clinic.rating != null && (
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.round(clinic.rating!) ? "fill-rating text-rating" : "text-muted"}`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-1">
              {clinic.rating}
            </span>
          </div>
        )}

        {clinic.services && clinic.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {clinic.services.slice(0, 3).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs font-normal">
                {s}
              </Badge>
            ))}
            {clinic.services.length > 3 && (
              <Badge variant="secondary" className="text-xs font-normal">
                +{clinic.services.length - 3}
              </Badge>
            )}
          </div>
        )}

        {clinic.opening_hours && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Clock className="w-3.5 h-3.5" />
            {clinic.opening_hours}
          </div>
        )}

        <div className="flex gap-2">
          <StartChatButton
            contactId={clinic.id}
            contactName={clinic.name}
            contactType="vet"
            contactEmail={clinic.email}
            subject={`Inquiry about ${clinic.name}`}
            stopPropagation
            size="sm"
            className="rounded-xl flex-1 text-xs"
          >
            Message
          </StartChatButton>
          {clinic.phone && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl flex-1 text-xs"
              onClick={handleWhatsApp}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" />
              WhatsApp
            </Button>
          )}
          {clinic.website && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl flex-1 text-xs"
              onClick={handleWebsite}
            >
              <Globe className="w-3.5 h-3.5 mr-1.5" />
              Website
            </Button>
          )}
          {clinic.phone && !clinic.website && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl flex-1 text-xs"
              onClick={handleCall}
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              Call
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
