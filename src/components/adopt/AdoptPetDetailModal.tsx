"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Shield, Scissors } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import ListingContactActions from "@/components/common/ListingContactActions";
import { getSpeciesFallback } from "@/components/adopt/pet-images";

type Pet = {
  id: string;
  name?: string;
  species?: string;
  breed?: string;
  age?: string;
  gender?: string;
  size?: string;
  description?: string;
  image_url?: string | null;
  location?: string;
  status?: string;
  vaccinated?: boolean;
  neutered?: boolean;
  poster_name?: string | null;
  poster_email?: string | null;
  poster_phone?: string | null;
  created_by?: string | null;
};

export default function AdoptPetDetailModal({
  pet,
  open,
  onClose,
  onApply,
}: {
  pet: Pet | null;
  open: boolean;
  onClose: () => void;
  onApply: (pet: Pet) => void;
}) {
  const { t } = useLanguage();
  const speciesFallback = useMemo(
    () => (pet ? getSpeciesFallback(pet) : ""),
    [pet]
  );
  const storedUrl =
    pet?.image_url && pet.image_url.trim().length > 0 ? pet.image_url.trim() : null;
  const [imageUrl, setImageUrl] = useState(storedUrl ?? speciesFallback);

  useEffect(() => {
    setImageUrl(storedUrl ?? speciesFallback);
  }, [pet?.id, storedUrl, speciesFallback]);

  if (!pet) return null;

  const meta = [pet.age, pet.size].filter(Boolean);
  const available = pet.status === "available";
  const posterEmail = pet.poster_email || pet.created_by || null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            {pet.name}
            {pet.gender ? (
              <span className="text-sm font-normal text-muted-foreground capitalize">
                · {pet.gender}
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="aspect-[4/3] relative overflow-hidden rounded-2xl bg-muted">
            <img
              src={imageUrl}
              alt={pet.name ?? "Pet"}
              className="w-full h-full object-cover"
              onError={() => {
                if (imageUrl !== speciesFallback) setImageUrl(speciesFallback);
              }}
            />
            <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground capitalize">
              {pet.species}
            </Badge>
            {!available ? (
              <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground">
                {t("Adoption Pending", "التبني قيد الانتظار")}
              </Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {pet.breed ? <span className="capitalize">{pet.breed}</span> : null}
            {meta.map((m, i) => (
              <span key={i} className="capitalize">
                · {m}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {pet.vaccinated ? (
              <div className="flex items-center gap-1.5 text-xs text-success">
                <Shield className="w-3.5 h-3.5" /> {t("Vaccinated", "مُطعّم")}
              </div>
            ) : null}
            {pet.neutered ? (
              <div className="flex items-center gap-1.5 text-xs text-success">
                <Scissors className="w-3.5 h-3.5" /> {t("Neutered", "مُعقّم")}
              </div>
            ) : null}
            {pet.location ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" /> {pet.location}
              </div>
            ) : null}
          </div>

          {pet.description ? (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {pet.description}
            </p>
          ) : null}

          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <ListingContactActions
              heading={t("Listed by", "أدرجه")}
              name={pet.poster_name}
              email={posterEmail}
              phone={pet.poster_phone}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={onClose}
            >
              {t("Close", "إغلاق")}
            </Button>
            <Button
              className="flex-1 rounded-xl"
              disabled={!available}
              onClick={() => onApply(pet)}
            >
              <Heart className="w-4 h-4 me-2" />
              {available
                ? t("Apply to adopt", "تقديم طلب تبني")
                : t("Not Available", "غير متاح")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
