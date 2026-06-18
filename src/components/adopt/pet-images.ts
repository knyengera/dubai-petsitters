import { FALLBACK_IMAGE, cleanImageUrl } from "@/lib/images";

type PetLike = { id?: string | number; species?: string | null };

/** Universal fallback image used for adoption listings without a usable photo. */
export function getSpeciesFallback(_pet?: PetLike): string {
  return FALLBACK_IMAGE;
}

export function getStoredImageUrl(pet: { image_url?: string | null }): string | null {
  return cleanImageUrl(pet.image_url);
}
