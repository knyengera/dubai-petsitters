export type CitySeo = {
  /** URL slug, e.g. "riyadh". */
  slug: string;
  /** English display name matching the `city` column values in the database. */
  name: string;
  /** Arabic display name, woven into metadata for bilingual search intent. */
  nameAr: string;
};

/**
 * Cities Saudi Petsitters operates in. The `name` values must match the city
 * strings stored on `pet_hosts.city` and `vet_clinics.city` (see HostFilters).
 */
export const SEO_CITIES: CitySeo[] = [
  { slug: "riyadh", name: "Riyadh", nameAr: "الرياض" },
  { slug: "jeddah", name: "Jeddah", nameAr: "جدة" },
  { slug: "dammam", name: "Dammam", nameAr: "الدمام" },
  { slug: "makkah", name: "Makkah", nameAr: "مكة" },
  { slug: "madinah", name: "Madinah", nameAr: "المدينة" },
  { slug: "khobar", name: "Khobar", nameAr: "الخبر" },
  { slug: "tabuk", name: "Tabuk", nameAr: "تبوك" },
  { slug: "abha", name: "Abha", nameAr: "أبها" },
];

export function getCityBySlug(slug: string): CitySeo | undefined {
  return SEO_CITIES.find((c) => c.slug === slug.toLowerCase());
}
