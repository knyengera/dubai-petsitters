import { z } from "zod";

export const UAE_CITIES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Al Ain",
  "Ras Al Khaimah",
  "Fujairah",
  "Umm Al Quwain",
  "Other",
] as const;

export const SPECIES_OPTIONS = [
  "Dogs",
  "Cats",
  "Birds",
  "Reptiles",
  "Horses",
  "Rabbits",
  "Exotic",
  "Other",
] as const;

export const VET_SERVICES_OPTIONS = [
  "Emergency",
  "Vaccinations",
  "Surgery",
  "Dental",
  "Grooming",
  "Boarding",
  "Lab/Diagnostics",
] as const;

export const PRODUCT_CATEGORY_OPTIONS = [
  "Food",
  "Accessories",
  "Toys",
  "Grooming supplies",
  "Aquarium",
  "Birds",
  "Other",
] as const;

export const INSURANCE_TYPE_OPTIONS = [
  "Health",
  "Accident",
  "Wellness",
  "Travel",
  "Liability",
  "Other",
] as const;

export const GROOMING_SERVICES_OPTIONS = [
  "Full groom",
  "Bath & brush",
  "Nail trim",
  "Teeth cleaning",
  "De-shedding",
  "Other",
] as const;

export const TRAINING_FORMAT_OPTIONS = [
  "In-home",
  "Facility",
  "Group classes",
  "Online",
  "Board & train",
] as const;

export const TRAINING_TYPE_OPTIONS = [
  "Obedience",
  "Puppy",
  "Behavior correction",
  "Agility",
  "Protection",
  "Service dog",
  "Other",
] as const;

export const ANIMAL_TYPE_OPTIONS = [
  "Dogs",
  "Cats",
  "Birds",
  "Reptiles",
  "Fish",
  "Horses",
  "Rabbits",
  "Other",
] as const;

export const PARTNER_TYPE_IDS = [
  "vet-clinics",
  "pet-shops",
  "pet-insurance",
  "groomers",
  "trainers",
  "breeders",
  "other",
] as const;

export type PartnerTypeId = (typeof PARTNER_TYPE_IDS)[number];

export const PARTNER_TYPES: {
  id: PartnerTypeId;
  label: string;
  desc: string;
}[] = [
  {
    id: "vet-clinics",
    label: "Vet Clinics",
    desc: "Reach thousands of pet owners looking for trusted care.",
  },
  {
    id: "pet-shops",
    label: "Pet Shops & Stores",
    desc: "Promote your products to an engaged UAE audience.",
  },
  {
    id: "pet-insurance",
    label: "Pet Insurance",
    desc: "Connect with owners seeking protection for their pets.",
  },
  {
    id: "groomers",
    label: "Groomers",
    desc: "Showcase mobile or on-site grooming services.",
  },
  {
    id: "trainers",
    label: "Trainers",
    desc: "Reach owners looking for professional pet training.",
  },
  {
    id: "breeders",
    label: "Breeders",
    desc: "List your breeding program and available animals.",
  },
  {
    id: "other",
    label: "Other",
    desc: "Pet-related businesses not listed above.",
  },
];

export type FieldInputType =
  | "text"
  | "textarea"
  | "select"
  | "multi-select"
  | "yes-no"
  | "comma-list";

export type ShowWhenCondition =
  | { field: string; equals: string }
  | { field: string; includes: string }
  | { field: string; includesAny: string[] }
  | { field: string; in: string[] };

export type PartnerFieldDef = {
  key: string;
  label: string;
  inputType: FieldInputType;
  required?: boolean;
  placeholder?: string;
  options?: readonly string[];
  showWhen?: ShowWhenCondition;
  section?: "details" | "promo";
};

const promoFields: PartnerFieldDef[] = [
  {
    key: "promo_title",
    label: "Promo Headline",
    inputType: "text",
    placeholder: "e.g. 20% off first visit this month!",
    section: "promo",
  },
  {
    key: "promo_description",
    label: "Promo Details",
    inputType: "textarea",
    placeholder: "Describe your offer, terms & conditions...",
    section: "promo",
  },
];

export const PARTNER_TYPE_FIELDS: Record<PartnerTypeId, PartnerFieldDef[]> = {
  "vet-clinics": [
    {
      key: "address",
      label: "Address",
      inputType: "text",
      required: true,
      placeholder: "Clinic street address",
    },
    {
      key: "specialties",
      label: "Specialties",
      inputType: "comma-list",
      required: true,
      placeholder: "e.g. Surgery, Dentistry, Exotic pets",
    },
    {
      key: "species_served",
      label: "Species Served",
      inputType: "multi-select",
      required: true,
      options: SPECIES_OPTIONS,
    },
    {
      key: "services_offered",
      label: "Services Offered",
      inputType: "multi-select",
      options: VET_SERVICES_OPTIONS,
    },
    {
      key: "operating_hours",
      label: "Operating Hours",
      inputType: "text",
      placeholder: "e.g. Sun–Thu 9am–9pm",
    },
    ...promoFields,
  ],
  "pet-shops": [
    {
      key: "store_type",
      label: "Store Type",
      inputType: "select",
      required: true,
      options: ["Physical store", "Online only", "Both"],
    },
    {
      key: "product_categories",
      label: "Product Categories",
      inputType: "multi-select",
      required: true,
      options: PRODUCT_CATEGORY_OPTIONS,
    },
    { key: "delivery_available", label: "Delivery Available", inputType: "yes-no" },
    { key: "pickup_available", label: "Pickup Available", inputType: "yes-no" },
    ...promoFields,
  ],
  "pet-insurance": [
    {
      key: "insurance_types",
      label: "Insurance Types Offered",
      inputType: "multi-select",
      required: true,
      options: INSURANCE_TYPE_OPTIONS,
    },
    {
      key: "travel_insurance",
      label: "Travel Insurance for Pets",
      inputType: "yes-no",
      required: true,
    },
    {
      key: "species_covered",
      label: "Species Covered",
      inputType: "multi-select",
      required: true,
      options: SPECIES_OPTIONS,
    },
    {
      key: "coverage_area",
      label: "Coverage Area",
      inputType: "select",
      required: true,
      options: ["Nationwide", "Specific cities"],
    },
    {
      key: "coverage_cities",
      label: "Cities Covered",
      inputType: "comma-list",
      required: true,
      placeholder: "e.g. Dubai, Abu Dhabi",
      showWhen: { field: "coverage_area", equals: "Specific cities" },
    },
    ...promoFields,
  ],
  groomers: [
    {
      key: "service_mode",
      label: "Service Mode",
      inputType: "select",
      required: true,
      options: ["Mobile", "On-site", "Both"],
    },
    {
      key: "service_area",
      label: "Service Area",
      inputType: "text",
      required: true,
      placeholder: "Areas you cover for mobile visits",
      showWhen: { field: "service_mode", in: ["Mobile", "Both"] },
    },
    {
      key: "address",
      label: "Address",
      inputType: "text",
      required: true,
      placeholder: "Salon / shop address",
      showWhen: { field: "service_mode", in: ["On-site", "Both"] },
    },
    {
      key: "species_served",
      label: "Species Served",
      inputType: "multi-select",
      required: true,
      options: ["Dogs", "Cats", "Rabbits", "Other"],
    },
    {
      key: "services_offered",
      label: "Services Offered",
      inputType: "multi-select",
      required: true,
      options: GROOMING_SERVICES_OPTIONS,
    },
    ...promoFields,
  ],
  trainers: [
    {
      key: "training_format",
      label: "Training Format",
      inputType: "multi-select",
      required: true,
      options: TRAINING_FORMAT_OPTIONS,
    },
    {
      key: "training_types",
      label: "Training Types",
      inputType: "multi-select",
      required: true,
      options: TRAINING_TYPE_OPTIONS,
    },
    {
      key: "species_served",
      label: "Species Served",
      inputType: "multi-select",
      required: true,
      options: SPECIES_OPTIONS,
    },
    {
      key: "service_area",
      label: "Service Area",
      inputType: "text",
      placeholder: "Cities or areas you cover",
    },
    ...promoFields,
  ],
  breeders: [
    {
      key: "animal_types",
      label: "Animal Types Bred",
      inputType: "multi-select",
      required: true,
      options: ANIMAL_TYPE_OPTIONS,
    },
    {
      key: "breeds",
      label: "Breeds",
      inputType: "comma-list",
      required: true,
      placeholder: "e.g. Golden Retriever, Siamese",
      showWhen: { field: "animal_types", includesAny: ["Dogs", "Cats"] },
    },
    {
      key: "registration",
      label: "Registration / Affiliation",
      inputType: "text",
      placeholder: "e.g. Kennel club, breed registry",
    },
    {
      key: "pickup_policy",
      label: "Pickup / Delivery Policy",
      inputType: "textarea",
      placeholder: "Describe pickup, delivery, or shipping options",
    },
    ...promoFields,
  ],
  other: [
    {
      key: "business_category",
      label: "Business Category",
      inputType: "text",
      required: true,
      placeholder: "Describe your business type",
    },
    {
      key: "services_summary",
      label: "Services / Products Summary",
      inputType: "textarea",
      required: true,
      placeholder: "What do you offer?",
    },
    {
      key: "service_area",
      label: "Service Area",
      inputType: "text",
      placeholder: "Cities or areas you serve",
    },
    ...promoFields,
  ],
};

export type BusinessDetails = Record<string, string | string[] | boolean | undefined>;

const stringArray = z.array(z.string()).min(1, "Select at least one option");

export const businessDetailsSchemas: Record<PartnerTypeId, z.ZodType<BusinessDetails>> = {
  "vet-clinics": z.object({
    address: z.string().min(1, "Address is required"),
    specialties: z.string().min(1, "Specialties are required"),
    species_served: stringArray,
    services_offered: z.array(z.string()).optional(),
    operating_hours: z.string().optional(),
    promo_title: z.string().optional(),
    promo_description: z.string().optional(),
  }),
  "pet-shops": z.object({
    store_type: z.string().min(1, "Store type is required"),
    product_categories: stringArray,
    delivery_available: z.boolean().optional(),
    pickup_available: z.boolean().optional(),
    promo_title: z.string().optional(),
    promo_description: z.string().optional(),
  }),
  "pet-insurance": z.object({
    insurance_types: stringArray,
    travel_insurance: z.boolean({ required_error: "Please indicate travel insurance availability" }),
    species_covered: stringArray,
    coverage_area: z.string().min(1, "Coverage area is required"),
    coverage_cities: z.string().optional(),
    promo_title: z.string().optional(),
    promo_description: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.coverage_area === "Specific cities" && !data.coverage_cities?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Cities covered is required", path: ["coverage_cities"] });
    }
  }),
  groomers: z.object({
    service_mode: z.string().min(1, "Service mode is required"),
    service_area: z.string().optional(),
    address: z.string().optional(),
    species_served: stringArray,
    services_offered: stringArray,
    promo_title: z.string().optional(),
    promo_description: z.string().optional(),
  }).superRefine((data, ctx) => {
    if ((data.service_mode === "Mobile" || data.service_mode === "Both") && !data.service_area?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Service area is required", path: ["service_area"] });
    }
    if ((data.service_mode === "On-site" || data.service_mode === "Both") && !data.address?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Address is required", path: ["address"] });
    }
  }),
  trainers: z.object({
    training_format: stringArray,
    training_types: stringArray,
    species_served: stringArray,
    service_area: z.string().optional(),
    promo_title: z.string().optional(),
    promo_description: z.string().optional(),
  }),
  breeders: z.object({
    animal_types: stringArray,
    breeds: z.string().optional(),
    registration: z.string().optional(),
    pickup_policy: z.string().optional(),
    promo_title: z.string().optional(),
    promo_description: z.string().optional(),
  }).superRefine((data, ctx) => {
    const needsBreeds = data.animal_types?.includes("Dogs") || data.animal_types?.includes("Cats");
    if (needsBreeds && !data.breeds?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Breeds are required for dog/cat breeders", path: ["breeds"] });
    }
  }),
  other: z.object({
    business_category: z.string().min(1, "Business category is required"),
    services_summary: z.string().min(1, "Services summary is required"),
    service_area: z.string().optional(),
    promo_title: z.string().optional(),
    promo_description: z.string().optional(),
  }),
};

export function getPartnerTypeById(id: string | null | undefined) {
  return PARTNER_TYPES.find((t) => t.id === id) ?? null;
}

export function getPartnerTypeLabel(id: string | null | undefined) {
  return getPartnerTypeById(id)?.label ?? "";
}

export function getPartnerTypeIdFromLabel(
  label: string | null | undefined
): PartnerTypeId | null {
  if (!label) return null;
  return PARTNER_TYPES.find((t) => t.label === label)?.id ?? null;
}

export function parsePartnerTypeFromSearchParams(
  type: string | string[] | null | undefined
): PartnerTypeId | null {
  const raw = Array.isArray(type) ? type[0] : type;
  if (!raw) return null;
  return PARTNER_TYPE_IDS.includes(raw as PartnerTypeId) ? (raw as PartnerTypeId) : null;
}

export function getDefaultBusinessDetails(_typeId: PartnerTypeId): BusinessDetails {
  return {};
}

export function isFieldVisible(field: PartnerFieldDef, details: BusinessDetails): boolean {
  if (!field.showWhen) return true;
  const value = details[field.showWhen.field];
  if ("equals" in field.showWhen) {
    return value === field.showWhen.equals;
  }
  if ("includes" in field.showWhen) {
    return Array.isArray(value) && value.includes(field.showWhen.includes);
  }
  if ("includesAny" in field.showWhen) {
    return Array.isArray(value) && field.showWhen.includesAny.some((v) => value.includes(v));
  }
  if ("in" in field.showWhen) {
    return typeof value === "string" && field.showWhen.in.includes(value);
  }
  return true;
}

export function validateBusinessDetails(
  typeId: PartnerTypeId,
  details: BusinessDetails
): { success: true; data: BusinessDetails } | { success: false; errors: Record<string, string> } {
  const visibleFields = PARTNER_TYPE_FIELDS[typeId].filter((f) => isFieldVisible(f, details));
  const filtered: BusinessDetails = {};

  for (const field of visibleFields) {
    const val = details[field.key];
    if (field.inputType === "multi-select") {
      filtered[field.key] = Array.isArray(val) ? val : [];
    } else if (field.inputType === "yes-no") {
      if (typeof val === "boolean") filtered[field.key] = val;
    } else if (field.inputType === "comma-list") {
      filtered[field.key] = typeof val === "string" ? val : "";
    } else {
      filtered[field.key] = typeof val === "string" ? val : "";
    }
  }

  const result = businessDetailsSchemas[typeId].safeParse(filtered);
  if (result.success) {
    return { success: true, data: normalizeBusinessDetails(typeId, result.data) };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

function normalizeBusinessDetails(typeId: PartnerTypeId, data: BusinessDetails): BusinessDetails {
  const normalized = { ...data };

  if (typeId === "breeders" && typeof normalized.breeds === "string") {
    normalized.breeds = normalized.breeds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeId === "pet-insurance" && typeof normalized.coverage_cities === "string") {
    normalized.coverage_cities = normalized.coverage_cities
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return normalized;
}

const FIELD_LABELS: Record<string, string> = {};
for (const fields of Object.values(PARTNER_TYPE_FIELDS)) {
  for (const f of fields) {
    FIELD_LABELS[f.key] = f.label;
  }
}

export function formatBusinessDetailsForDisplay(
  businessType: string,
  details: BusinessDetails | null | undefined
): { label: string; value: string }[] {
  if (!details || typeof details !== "object") return [];

  const rows: { label: string; value: string }[] = [];
  for (const [key, val] of Object.entries(details)) {
    if (val === undefined || val === null || val === "") continue;
    const label = FIELD_LABELS[key] ?? key.replace(/_/g, " ");
    let value: string;
    if (Array.isArray(val)) {
      value = val.join(", ");
    } else if (typeof val === "boolean") {
      value = val ? "Yes" : "No";
    } else {
      value = String(val);
    }
    rows.push({ label, value });
  }
  if (businessType) {
    rows.unshift({ label: "Business Type", value: businessType });
  }
  return rows;
}
