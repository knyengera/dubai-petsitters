"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/lib/data/entities";
import { Button } from "@/components/ui/button";
import StartChatButton from "@/components/messaging/StartChatButton";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MapPin,
  Phone,
  Globe,
  ArrowLeft,
  ExternalLink,
  Loader2,
  Send,
  Tag,
} from "lucide-react";
import PhotoGallery from "@/components/common/PhotoGallery";
import ReviewsList from "@/components/reviews/ReviewsList";
import { FALLBACK_IMAGE } from "@/lib/images";
import { formatBusinessDetailsForDisplay } from "@/lib/partners/partner-types";
import { isVetPartner } from "@/lib/partners/queries";

export default function PartnerDetail() {
  const { id } = useParams();
  const router = useRouter();

  const { data: partner, isLoading } = useQuery({
    queryKey: ["partner", id],
    queryFn: () => entities.VetClinic.get(id as string),
    enabled: !!id,
  });

  useEffect(() => {
    if (partner && isVetPartner(partner)) {
      router.replace(`/vets/${partner.id}`);
    }
  }, [partner, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!partner || isVetPartner(partner)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Partner not found.</p>
      </div>
    );
  }

  const galleryPhotos = [partner.image_url, ...(partner.gallery || [])].filter(Boolean);
  const fallbackPhotos = galleryPhotos.length > 0 ? galleryPhotos : [FALLBACK_IMAGE];
  const mapQuery = encodeURIComponent(
    [partner.name, partner.address, partner.city, "Saudi Arabia"].filter(Boolean).join(", ")
  );
  const detailRows = formatBusinessDetailsForDisplay(
    partner.business_type,
    partner.business_details
  );
  const promoTitle =
    typeof partner.business_details?.promo_title === "string"
      ? partner.business_details.promo_title
      : "";
  const promoDescription =
    typeof partner.business_details?.promo_description === "string"
      ? partner.business_details.promo_description
      : "";

  const handleWhatsApp = () => {
    if (partner.phone) {
      const phoneNumber = partner.phone.replace(/\D/g, "");
      window.open(
        `https://wa.me/${phoneNumber}?text=Hello, I'd like to inquire about your services`,
        "_blank"
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-3 flex items-center justify-between">
        <Link href="/partners">
          <Button variant="outline" size="sm" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </Link>
        {partner.business_type && (
          <Badge className="bg-primary text-primary-foreground border-0 shadow">
            {partner.business_type}
          </Badge>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <h1 className="font-heading text-3xl lg:text-4xl font-extrabold text-foreground mb-1">
          {partner.name}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {partner.city}
            {partner.address ? `, ${partner.address}` : ""}
          </span>
          {partner.rating && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-rating text-rating" />
              {partner.rating}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <PhotoGallery photos={fallbackPhotos} name={partner.name} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-8">
            {(promoTitle || promoDescription) && (
              <section className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-primary font-semibold mb-1">
                  <Tag className="w-4 h-4" />
                  {promoTitle || "Special Offer"}
                </div>
                {promoDescription && (
                  <p className="text-sm text-muted-foreground">{promoDescription}</p>
                )}
              </section>
            )}

            {partner.rating && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">Rating</h2>
                <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-5">
                  <div className="text-4xl font-extrabold text-primary font-heading">
                    {partner.rating}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${i < Math.round(partner.rating) ? "fill-rating text-rating" : "text-muted"}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">Based on customer reviews</p>
                  </div>
                </div>
              </section>
            )}

            {detailRows.length > 0 && (
              <section>
                <h2 className="font-heading text-xl font-bold text-foreground mb-3">
                  Business Details
                </h2>
                <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                  {detailRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-5 py-3"
                    >
                      <span className="text-sm font-semibold text-foreground sm:w-48 shrink-0 capitalize">
                        {row.label}
                      </span>
                      <span className="text-sm text-muted-foreground">{row.value}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-heading text-xl font-bold text-foreground mb-4">Reviews</h2>
              <ReviewsList targetId={partner.id} targetType="vet" targetName={partner.name} />
            </section>

            <section>
              <h2 className="font-heading text-xl font-bold text-foreground mb-3">Location</h2>
              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow">
                <div className="h-72">
                  <iframe
                    title="Partner location map"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${mapQuery}&output=embed&zoom=15`}
                  />
                </div>
                <div className="p-3 flex items-center justify-between border-t border-border">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {partner.city}
                    {partner.address ? `, ${partner.address}` : ""}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs font-medium flex items-center gap-1 hover:underline"
                  >
                    Open in Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:w-96 space-y-5">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg lg:sticky lg:top-24 space-y-3">
              <h2 className="font-heading text-lg font-bold text-foreground">
                Contact the Business
              </h2>
              {partner.phone && (
                <a href={`tel:${partner.phone}`} className="block">
                  <Button className="w-full rounded-xl bg-primary h-11 font-bold">
                    <Phone className="w-4 h-4 mr-2" /> Call Now
                  </Button>
                </a>
              )}
              <StartChatButton
                contactId={partner.id}
                contactName={partner.name}
                contactType="vet"
                contactEmail={partner.email}
                subject={`Inquiry about ${partner.name}`}
                className="w-full h-11"
              >
                Message
              </StartChatButton>
              {partner.phone && (
                <Button
                  variant="outline"
                  onClick={handleWhatsApp}
                  className="w-full rounded-xl h-11"
                >
                  <Send className="w-4 h-4 mr-2" /> WhatsApp
                </Button>
              )}
              {partner.website && (
                <a href={partner.website} target="_blank" rel="noopener noreferrer" className="block">
                  <Button variant="outline" className="w-full rounded-xl h-11">
                    <Globe className="w-4 h-4 mr-2" /> Visit Website
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
