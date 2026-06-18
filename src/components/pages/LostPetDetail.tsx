"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/lib/data/entities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Calendar, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { lostPetStatus } from "@/lib/ui/status-styles";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import ListingContactActions from "@/components/common/ListingContactActions";
import { getSpeciesFallback, getStoredImageUrl } from "@/components/lost-pets/pet-images";

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  lost: { en: "Lost", ar: "ضائع" },
  found: { en: "Found", ar: "تم العثور" },
  reunited: { en: "Reunited", ar: "عاد" },
};

function Fact({ label, value }: { label: string; value?: string | null }) {
  if (!value || String(value).trim() === "") return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-sm text-foreground break-words">{value}</p>
    </div>
  );
}

export default function LostPetDetail() {
  const { id } = useParams();
  const { t } = useLanguage();

  const { data: pet, isLoading } = useQuery({
    queryKey: ["lostPet", id],
    queryFn: () => entities.LostPet.get(id),
    enabled: !!id,
  });

  const speciesFallback = useMemo(() => (pet ? getSpeciesFallback(pet) : ""), [pet]);
  const storedUrl = useMemo(() => (pet ? getStoredImageUrl(pet) : null), [pet]);
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
        <p className="text-muted-foreground">{t("Report not found.", "لم يتم العثور على البلاغ.")}</p>
        <Link href="/lost-pets">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t("Back to Lost Pets", "العودة للحيوانات المفقودة")}
          </Button>
        </Link>
      </div>
    );
  }

  const status = pet.status ?? "lost";
  const statusClass =
    lostPetStatus[status as keyof typeof lostPetStatus] ?? lostPetStatus.lost;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-3">
        <Link href="/lost-pets">
          <Button variant="outline" size="sm" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1" /> {t("Back", "رجوع")}
          </Button>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-6">
        <div className="aspect-[16/10] relative overflow-hidden rounded-3xl bg-muted">
          <img
            src={imageUrl || speciesFallback}
            alt={pet.pet_name ?? "Lost pet"}
            className="w-full h-full object-cover"
            onError={() => {
              if (imageUrl !== speciesFallback) setImageUrl(speciesFallback);
            }}
          />
          <Badge className="absolute top-4 left-4 bg-primary/90 text-primary-foreground capitalize">
            {pet.species ?? t("Pet", "حيوان")}
          </Badge>
          <span
            className={`absolute top-4 right-4 text-xs px-2.5 py-1 rounded-full font-medium ${statusClass}`}
          >
            {t(
              STATUS_LABELS[status]?.en ?? status,
              STATUS_LABELS[status]?.ar ?? status
            )}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {pet.pet_name}
          </h1>
          {pet.reward_offered ? (
            <Badge variant="warning" className="shrink-0">
              {t("Reward", "مكافأة")} · {DEFAULT_CURRENCY} {pet.reward_offered}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          {(pet.city || pet.last_seen_location) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{[pet.last_seen_location, pet.city].filter(Boolean).join(", ")}</span>
            </div>
          )}
          {pet.last_seen_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>
                {t("Last seen", "آخر ظهور")}: {pet.last_seen_date}
              </span>
            </div>
          )}
        </div>

        {pet.description ? (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {pet.description}
          </p>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <Fact label={t("Breed", "السلالة")} value={pet.breed} />
          <Fact label={t("Color", "اللون")} value={pet.color} />
          <Fact label={t("Gender", "الجنس")} value={pet.gender} />
          <Fact label={t("Age", "العمر")} value={pet.age} />
        </div>

        <div className="rounded-3xl border border-border bg-muted/20 p-6">
          <ListingContactActions
            heading={t("Owner", "المالك")}
            name={pet.owner_name}
            email={pet.owner_email}
            phone={pet.owner_phone}
          />
        </div>
      </div>
    </div>
  );
}
