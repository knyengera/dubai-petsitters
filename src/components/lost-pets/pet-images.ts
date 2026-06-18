/** Verified Unsplash fallbacks for lost pet reports without an uploaded photo. */
export const petImageFallbacks: Record<string, string[]> = {
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

export function getSpeciesFallback(pet: PetLike): string {
  const species = pet.species ?? "other";
  const fallbacks = petImageFallbacks[species] ?? petImageFallbacks.other;
  const index =
    Math.abs(
      String(pet.id ?? "")
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % fallbacks.length;
  return fallbacks[index];
}

export function getStoredImageUrl(pet: { image_url?: string | null }): string | null {
  const url = pet.image_url;
  return typeof url === "string" && url.trim().length > 0 ? url.trim() : null;
}
