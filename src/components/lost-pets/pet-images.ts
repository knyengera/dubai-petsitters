import { FALLBACK_IMAGE, cleanImageUrl } from "@/lib/images";

export type LostPet = {
  id: string;
  pet_name?: string;
  species?: string;
  breed?: string;
  image_url?: string | null;
  status?: string;
  city?: string;
  color?: string;
  gender?: string;
  age?: string;
  last_seen_location?: string;
  last_seen_date?: string;
  description?: string;
  owner_name?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
  reward_offered?: number | string | null;
};

type PetLike = { id?: string | number; species?: string | null };

/** Universal fallback image used for lost pet reports without a usable photo. */
export function getSpeciesFallback(_pet?: PetLike): string {
  return FALLBACK_IMAGE;
}

export function getStoredImageUrl(pet: { image_url?: string | null }): string | null {
  return cleanImageUrl(pet.image_url);
}
