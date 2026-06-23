export type CitySeo = {
  /** URL slug, e.g. "riyadh". */
  slug: string;
  /** English display name matching the `city` column values in the database. */
  name: string;
  /** Arabic display name, woven into metadata for bilingual search intent. */
  nameAr: string;
};

/**
 * Cities Dubai Petsitters operates in. The `name` values must match the city
 * strings stored on `pet_hosts.city` and `vet_clinics.city` (see HostFilters).
 */
export const SEO_CITIES: CitySeo[] = [
  { slug: "dubai", name: "Dubai", nameAr: "دبي" },
  { slug: "abu-dhabi", name: "Abu Dhabi", nameAr: "أبوظبي" },
  { slug: "sharjah", name: "Sharjah", nameAr: "الشارقة" },
  { slug: "ajman", name: "Ajman", nameAr: "عجمان" },
  { slug: "al-ain", name: "Al Ain", nameAr: "العين" },
  { slug: "ras-al-khaimah", name: "Ras Al Khaimah", nameAr: "رأس الخيمة" },
  { slug: "fujairah", name: "Fujairah", nameAr: "الفجيرة" },
  { slug: "umm-al-quwain", name: "Umm Al Quwain", nameAr: "أم القيوين" },
];

export function getCityBySlug(slug: string): CitySeo | undefined {
  return SEO_CITIES.find((c) => c.slug === slug.toLowerCase());
}
