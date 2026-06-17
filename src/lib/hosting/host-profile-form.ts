import { Home, Sun, Dog, Footprints } from "lucide-react";

export const HOST_SERVICE_OPTIONS = [
  { id: "boarding", icon: Home, label: "Pet Boarding" },
  { id: "daycare", icon: Sun, label: "Daycare" },
  { id: "home_sitting", icon: Dog, label: "Home Sitting" },
  { id: "dog_walking", icon: Footprints, label: "Dog Walking" },
] as const;

export type HostProfileFormState = {
  full_name: string;
  bio: string;
  city: string;
  neighborhood: string;
  price_per_night: string;
  price_per_day: string;
  languages: string;
  accepted_pet_types: string;
  has_yard: boolean;
  non_smoking: boolean;
};

export const emptyHostProfileForm = (): HostProfileFormState => ({
  full_name: "",
  bio: "",
  city: "",
  neighborhood: "",
  price_per_night: "",
  price_per_day: "",
  languages: "",
  accepted_pet_types: "",
  has_yard: false,
  non_smoking: true,
});

export function hostRecordToForm(record: Record<string, unknown>): HostProfileFormState {
  const languages = Array.isArray(record.languages)
    ? (record.languages as string[]).join(", ")
    : String(record.languages ?? "");
  const acceptedPetTypes = Array.isArray(record.accepted_pet_types)
    ? (record.accepted_pet_types as string[]).join(", ")
    : String(record.accepted_pet_types ?? "");

  return {
    full_name: String(record.full_name ?? ""),
    bio: String(record.bio ?? ""),
    city: String(record.city ?? ""),
    neighborhood: String(record.neighborhood ?? ""),
    price_per_night: record.price_per_night != null ? String(record.price_per_night) : "",
    price_per_day: record.price_per_day != null ? String(record.price_per_day) : "",
    languages,
    accepted_pet_types: acceptedPetTypes,
    has_yard: Boolean(record.has_yard),
    non_smoking: record.non_smoking !== false,
  };
}

export function hostFormToPayload(
  form: HostProfileFormState,
  selectedServices: string[],
  photoUrl?: string | null,
  galleryUrls: string[] = []
) {
  return {
    ...form,
    photo_url: photoUrl,
    gallery: galleryUrls,
    services: selectedServices,
    price_per_night: parseFloat(form.price_per_night) || null,
    price_per_day: parseFloat(form.price_per_day) || null,
    languages: form.languages ? form.languages.split(",").map((l) => l.trim()) : [],
    accepted_pet_types: form.accepted_pet_types
      ? form.accepted_pet_types.split(",").map((p) => p.trim())
      : [],
  };
}

export function servicesFromRecord(record: Record<string, unknown>): string[] {
  return Array.isArray(record.services) ? (record.services as string[]) : [];
}
