"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, Globe, Sparkles, Send, Phone, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import StartChatButton from "@/components/messaging/StartChatButton";
import { FALLBACK_IMAGE } from "@/lib/images";

export type PartnerCardModel = {
  id: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  is_featured?: boolean;
  rating?: number;
  business_type?: string;
  business_details?: Record<string, unknown> | null;
};

export default function PartnerCard({
  partner,
  index = 0,
}: {
  partner: PartnerCardModel;
  index?: number;
}) {
  const router = useRouter();
  const bgImage = partner.image_url || FALLBACK_IMAGE;
  const promoTitle =
    typeof partner.business_details?.promo_title === "string"
      ? partner.business_details.promo_title
      : "";

  const goToDetail = () => router.push(`/partners/${partner.id}`);

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (partner.phone) {
      const phoneNumber = partner.phone.replace(/\D/g, "");
      window.open(
        `https://wa.me/${phoneNumber}?text=Hello, I'd like to inquire about your services`,
        "_blank"
      );
    }
  };

  const handleWebsite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (partner.website) window.open(partner.website, "_blank");
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (partner.phone) window.location.href = `tel:${partner.phone}`;
  };

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
          alt={partner.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {partner.is_featured && (
          <div className="absolute top-3 left-3">
            <Badge variant="warning" className="border-0 shadow-lg text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Sponsored
            </Badge>
          </div>
        )}
        {partner.business_type && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-primary text-primary-foreground border-0 shadow-lg text-xs">
              {partner.business_type}
            </Badge>
          </div>
        )}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-heading font-bold text-white text-lg leading-tight drop-shadow">
            {partner.name}
          </h3>
          {(partner.city || partner.address) && (
            <div className="flex items-center gap-1 text-white/80 text-xs mt-0.5">
              <MapPin className="w-3 h-3" />
              {partner.city}
              {partner.address ? `${partner.city ? ", " : ""}${partner.address}` : ""}
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {partner.rating != null && (
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${i < Math.round(partner.rating!) ? "fill-rating text-rating" : "text-muted"}`}
              />
            ))}
            <span className="text-sm text-muted-foreground ml-1">
              {partner.rating}
            </span>
          </div>
        )}

        {promoTitle && (
          <div className="flex items-center gap-1.5 text-xs text-primary font-medium mb-3">
            <Tag className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{promoTitle}</span>
          </div>
        )}

        <div className="flex gap-2">
          <StartChatButton
            contactId={partner.id}
            contactName={partner.name}
            contactType="vet"
            contactEmail={partner.email}
            subject={`Inquiry about ${partner.name}`}
            stopPropagation
            size="sm"
            className="rounded-xl flex-1 text-xs"
          >
            Message
          </StartChatButton>
          {partner.phone && (
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
          {partner.website && (
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
          {partner.phone && !partner.website && (
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
