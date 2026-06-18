"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/lib/data/entities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Shield, Scissors, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import ListingContactActions from "@/components/common/ListingContactActions";
import AdoptionForm from "@/components/adopt/AdoptionForm";
import { getSpeciesFallback } from "@/components/adopt/pet-images";

export default function AdoptPetDetail() {
  const { id } = useParams();
  const { t } = useLanguage();

  const { data: pet, isLoading } = useQuery({
    queryKey: ["pet", id],
    queryFn: () => entities.Pet.get(id),
    enabled: !!id,
  });

  const speciesFallback = useMemo(
    () => (pet ? getSpeciesFallback(pet) : ""),
    [pet]
  );
  const storedUrl =
    pet?.image_url && String(pet.image_url).trim().length > 0
      ? String(pet.image_url).trim()
      : null;
  const [imageUrl, setImageUrl] = useState(storedUrl ?? speciesFallback);

  useEffect(() => {
    setImageUrl(storedUrl ?? speciesFallback);
  }, [pet?.id, storedUrl, speciesFallback]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{t("Pet not found.", "لم يتم العثور على الحيوان.")}</p>
        <Link href="/adopt">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t("Back to Adopt", "العودة للتبني")}
          </Button>
        </Link>
      </div>
    );
  }

  const available = pet.status === "available";
  const posterEmail = pet.poster_email || pet.created_by || null;
  const meta = [pet.age, pet.size].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-3">
        <Link href="/adopt">
          <Button variant="outline" size="sm" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t("Back", "رجوع")}
          </Button>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12 items-start">
          {/* Details */}
          <div className="space-y-6">
            <div className="aspect-[4/3] relative overflow-hidden rounded-3xl bg-muted">
              <img
                src={imageUrl || speciesFallback}
                alt={pet.name ?? "Pet"}
                className="w-full h-full object-cover"
                onError={() => {
                  if (imageUrl !== speciesFallback) setImageUrl(speciesFallback);
                }}
              />
              <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground capitalize">
                {pet.species}
              </Badge>
              {!available ? (
                <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                  {t("Adoption Pending", "التبني قيد الانتظار")}
                </Badge>
              ) : null}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading text-3xl font-bold text-foreground">
                  {pet.name}
                </h1>
                {pet.gender ? (
                  <span className="text-base text-muted-foreground capitalize">
                    {pet.gender}
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {pet.breed ? <span className="capitalize">{pet.breed}</span> : null}
                {meta.map((m, i) => (
                  <span key={i} className="capitalize">
                    · {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {pet.vaccinated ? (
                <div className="flex items-center gap-1.5 text-sm text-success">
                  <Shield className="w-4 h-4" /> {t("Vaccinated", "مُطعّم")}
                </div>
              ) : null}
              {pet.neutered ? (
                <div className="flex items-center gap-1.5 text-sm text-success">
                  <Scissors className="w-4 h-4" /> {t("Neutered", "مُعقّم")}
                </div>
              ) : null}
              {pet.location ? (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {pet.location}
                </div>
              ) : null}
            </div>

            {pet.description ? (
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {t("About", "نبذة")}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {pet.description}
                </p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-muted/20 p-5">
              <ListingContactActions
                heading={t("Listed by", "أدرجه")}
                name={pet.poster_name}
                email={posterEmail}
                phone={pet.poster_phone}
              />
            </div>
          </div>

          {/* Apply form */}
          <div className="lg:sticky lg:top-24">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <h2 className="font-heading text-xl font-semibold text-foreground mb-1">
                {available
                  ? t(`Adopt ${pet.name}`, `تبنّى ${pet.name}`)
                  : t("Not available", "غير متاح")}
              </h2>
              <p className="text-sm text-muted-foreground mb-5">
                {available
                  ? t(
                      "Fill in your details and the lister will be in touch.",
                      "املأ بياناتك وسيتواصل معك المُدرج."
                    )
                  : t(
                      "This pet is no longer available for adoption.",
                      "هذا الحيوان لم يعد متاحًا للتبني."
                    )}
              </p>
              {available ? <AdoptionForm pet={pet} /> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
