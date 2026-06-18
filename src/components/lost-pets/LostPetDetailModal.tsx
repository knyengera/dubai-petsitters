"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { lostPetStatus } from "@/lib/ui/status-styles";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import ListingContactActions from "@/components/common/ListingContactActions";
import {
  getSpeciesFallback,
  getStoredImageUrl,
  type LostPet,
} from "@/components/lost-pets/pet-images";

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

export default function LostPetDetailModal({
  pet,
  open,
  onClose,
}: {
  pet: LostPet | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useLanguage();
  const speciesFallback = useMemo(() => (pet ? getSpeciesFallback(pet) : ""), [pet]);
  const storedUrl = useMemo(() => (pet ? getStoredImageUrl(pet) : null), [pet]);
  const [imageUrl, setImageUrl] = useState(storedUrl ?? speciesFallback);

  useEffect(() => {
    setImageUrl(storedUrl ?? speciesFallback);
  }, [pet?.id, storedUrl, speciesFallback]);

  if (!pet) return null;

  const status = pet.status ?? "lost";
  const statusClass =
    lostPetStatus[status as keyof typeof lostPetStatus] ?? lostPetStatus.lost;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            {pet.pet_name}
            {pet.reward_offered ? (
              <Badge variant="warning" className="shrink-0">
                {t("Reward", "مكافأة")} · {DEFAULT_CURRENCY} {pet.reward_offered}
              </Badge>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="aspect-[4/3] relative overflow-hidden rounded-2xl bg-muted">
            <img
              src={imageUrl}
              alt={pet.pet_name ?? "Lost pet"}
              className="w-full h-full object-cover"
              onError={() => {
                if (imageUrl !== speciesFallback) setImageUrl(speciesFallback);
              }}
            />
            <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground capitalize">
              {pet.species ?? t("Pet", "حيوان")}
            </Badge>
            <span
              className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-medium ${statusClass}`}
            >
              {t(
                STATUS_LABELS[status]?.en ?? status,
                STATUS_LABELS[status]?.ar ?? status
              )}
            </span>
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

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <Fact label={t("Breed", "السلالة")} value={pet.breed} />
            <Fact label={t("Color", "اللون")} value={pet.color} />
            <Fact label={t("Gender", "الجنس")} value={pet.gender} />
            <Fact label={t("Age", "العمر")} value={pet.age} />
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <ListingContactActions
              heading={t("Owner", "المالك")}
              name={pet.owner_name}
              email={pet.owner_email}
              phone={pet.owner_phone}
            />
          </div>

          <Button variant="outline" className="w-full rounded-xl" onClick={onClose}>
            {t("Close", "إغلاق")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
