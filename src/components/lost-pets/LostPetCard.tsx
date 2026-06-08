"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Calendar } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { lostPetStatus } from "@/lib/ui/status-styles";

const petImageFallbacks: Record<string, string[]> = {
  dog: [
    "https://images.unsplash.com/photo-1534227572793-a440d8a6d3ca?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1577720643272-265f434f0c41?w=600&h=450&fit=crop&q=80",
  ],
  cat: [
    "https://images.unsplash.com/photo-1513360371669-4a0eb3e4fedd?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600&h=450&fit=crop&q=80",
  ],
  bird: [
    "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=450&fit=crop&q=80",
  ],
  rabbit: [
    "https://images.unsplash.com/photo-1585110396000-c9ffd4d4b3f0?w=600&h=450&fit=crop&q=80",
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
  photo_url?: string | null;
  image_url?: string | null;
  status?: string;
  city?: string;
  last_seen_location?: string;
  last_seen_date?: string;
  description?: string;
  owner_phone?: string;
  reward_offered?: number | string | null;
};

function getImageUrl(pet: LostPet) {
  if (pet.photo_url) return pet.photo_url;
  if (pet.image_url) return pet.image_url;
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

export default function LostPetCard({ pet }: { pet: LostPet }) {
  const { t } = useLanguage();
  const imageUrl = getImageUrl(pet);
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
            <span className="text-xs font-semibold text-warning shrink-0">
              SAR {pet.reward_offered}
            </span>
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
