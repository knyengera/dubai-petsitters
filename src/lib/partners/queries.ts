import { PARTNER_TYPES } from "@/lib/partners/partner-types";

export const VET_BUSINESS_TYPE_LABEL = "Vet Clinics";

/** Labels for every partner business type except vet clinics. */
export const NON_VET_PARTNER_LABELS = PARTNER_TYPES.filter(
  (t) => t.id !== "vet-clinics"
).map((t) => t.label);

/** Business type options for the non-vet partner directory filters. */
export const NON_VET_PARTNER_TYPES = PARTNER_TYPES.filter(
  (t) => t.id !== "vet-clinics"
);

export function isNonVetPartner(row: {
  business_type?: string | null;
}): boolean {
  return (row.business_type ?? "") !== VET_BUSINESS_TYPE_LABEL;
}

export function isVetPartner(row: {
  business_type?: string | null;
}): boolean {
  return (row.business_type ?? "") === VET_BUSINESS_TYPE_LABEL;
}
