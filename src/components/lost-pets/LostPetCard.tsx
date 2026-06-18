"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Calendar } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { lostPetStatus } from "@/lib/ui/status-styles";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";

const petImageFallbacks: Record<string, string[]> = {
  dog: [
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=450&fit=crop&q=80",
  ],
  cat: [
    "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600&h=450&fit=crop&q=80",
  ],
  bird: [
    "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=450&fit=crop&q=80",
  ],
  rabbit: [
    "https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=600&h=450&fit=crop&q=80",
  ],
  other: [
    "https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=600&h=450&fit=crop&q=80",
  ],
};

const STATUS_LABELS: Record<
  string,
  { en: string; ar: string }
> = {
  lost: { en: "Lost", ar: "ضائع" },
  found: { en: "Found", ar: "تم العثور" },
  reunited: { en: "Reunited", ar: "عاد" },
};

type LostPet = {
  id: string;
  pet_name?: string;
  species?: string;
  breed?: string;
  image_url?: string | null;
  status?: string;
  city?: string;
  last_seen_location?: string;
  last_seen_date?: string;
  description?: string;
  owner_phone?: string;
  reward_offered?: number | string | null;
};

function getSpeciesFallback(pet: LostPet) {
  const species = pet.species ?? "other";
  const fallbacks = petImageFallbacks[species] ?? petImageFallbacks.other;
  const index =
    Math.abs(
      String(pet.id)
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % fallbacks.length;
  return fallbacks[index];
}

function getStoredImageUrl(pet: LostPet) {
  const url = pet.image_url;
  return typeof url === "string" && url.trim().length > 0 ? url.trim() : null;
}

export default function LostPetCard({ pet }: { pet: LostPet }) {
  const { t } = useLanguage();
  const storedUrl = useMemo(() => getStoredImageUrl(pet), [pet.image_url]);
  const speciesFallback = useMemo(() => getSpeciesFallback(pet), [pet]);
  const [imageUrl, setImageUrl] = useState(storedUrl ?? speciesFallback);

  useEffect(() => {
    setImageUrl(storedUrl ?? speciesFallback);
  }, [pet.id, storedUrl, speciesFallback]);

  const handleImageError = () => {
    if (imageUrl !== speciesFallback) {
      setImageUrl(speciesFallback);
    }
  };
  const status = pet.status ?? "lost";
  const statusClass =
    lostPetStatus[status as keyof typeof lostPetStatus] ?? lostPetStatus.lost;

  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-xl transition-all duration-300 group h-full flex flex-col">
      <div className="aspect-[4/3] relative overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={pet.pet_name ?? "Lost pet"}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={handleImageError}
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

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-foreground text-lg">
            {pet.pet_name}
          </h3>
          {pet.reward_offered ? (
            <Badge variant="warning" className="shrink-0">
              {t("Reward", "مكافأة")} · {DEFAULT_CURRENCY} {pet.reward_offered}
            </Badge>
          ) : null}
        </div>

        {pet.breed ? (
          <p className="text-sm text-muted-foreground mb-2 capitalize">
            {pet.breed}
          </p>
        ) : null}

        <div className="flex flex-col gap-2 mb-4 text-sm text-muted-foreground">
          {(pet.city || pet.last_seen_location) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="line-clamp-1">
                {pet.city || pet.last_seen_location}
              </span>
            </div>
          )}
          {pet.last_seen_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>
                {t("Last seen", "آخر ظهور")}: {pet.last_seen_date}
              </span>
            </div>
          )}
        </div>

        {pet.description ? (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {pet.description}
          </p>
        ) : (
          <div className="flex-1" />
        )}

        {pet.owner_phone ? (
          <a
            href={`tel:${pet.owner_phone}`}
            className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-2.5 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
          >
            <Phone className="w-4 h-4 me-2" />
            {t("Contact Owner", "تواصل مع المالك")}
          </a>
        ) : null}
      </div>
    </div>
  );
}
