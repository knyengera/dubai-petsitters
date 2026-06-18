/** Verified Unsplash fallbacks for adoption listings without an uploaded photo. */
export const petImageFallbacks: Record<string, string[]> = {
  dog: [
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&h=450&fit=crop&q=80",
  ],
  cat: [
    "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=600&h=450&fit=crop&q=80",
  ],
  bird: [
    "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=450&fit=crop&q=80",
    "https://images.unsplash.com/photo-1520808663317-647b476a81b9?w=600&h=450&fit=crop&q=80",
  ],
  rabbit: [
    "https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=600&h=450&fit=crop&q=80",
  ],
  fish: [
    "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&h=450&fit=crop&q=80",
  ],
  reptile: [
    "https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=600&h=450&fit=crop&q=80",
  ],
  other: [
    "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&h=450&fit=crop&q=80",
  ],
};

type PetLike = { id?: string | number; species?: string | null };

/** Stable (non-random) fallback so the card and detail modal show the same photo. */
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
