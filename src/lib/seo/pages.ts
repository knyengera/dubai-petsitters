import type { BuildMetadataInput } from "@/lib/seo/metadata";

export type PageSeo = Omit<BuildMetadataInput, "path"> & { path: string };

const CITIES = "Riyadh, Jeddah, Dammam & Khobar";

/**
 * Per-route SEO copy for static public pages. Titles omit the brand suffix
 * (the layout template appends "| Saudi Petsitters") unless absoluteTitle is set.
 * Descriptions weave in city names and Arabic keywords for Saudi local search.
 */
export const PAGE_SEO: Record<string, PageSeo> = {
  "/": {
    path: "/",
    absoluteTitle: true,
    title: "Saudi Petsitters | Pet Sitting, Boarding & Vets in Saudi Arabia",
    description:
      "Find trusted pet sitters, boarding, dog walking, and veterinary clinics across Saudi Arabia. Book in-home pet care in Riyadh, Jeddah, Dammam & Khobar. استضافة وفندقة الحيوانات الأليفة.",
    keywords: [
      "pet sitting Saudi Arabia",
      "pet boarding Riyadh",
      "pet sitter Riyadh",
      "dog walking Riyadh",
      "cat sitting Riyadh",
      "find a vet Saudi Arabia",
      "استضافة حيوانات",
      "فندقة حيوانات أليفة",
    ],
  },
  "/hosting": {
    path: "/hosting",
    title: "Pet Hosting & Boarding in Saudi Arabia",
    description:
      "Trusted pet hosting, boarding, daycare, and in-home sitting while you travel. Browse verified hosts in " +
      CITIES +
      ". فندقة واستضافة الحيوانات الأليفة في السعودية.",
    keywords: [
      "pet boarding Saudi Arabia",
      "pet hosting Riyadh",
      "dog hotel Riyadh",
      "pet daycare Jeddah",
      "in-home pet care",
      "فندقة حيوانات",
    ],
  },
  "/hosts": {
    path: "/hosts",
    title: "Find a Pet Sitter in Saudi Arabia",
    description:
      "Browse trusted, verified pet sitters and hosts for boarding, daycare, dog walking, and home sitting across " +
      CITIES +
      ". Book the perfect care for your pet. مربي حيوانات موثوق.",
    keywords: [
      "pet sitter Saudi Arabia",
      "pet sitter Riyadh",
      "cat sitting Riyadh",
      "dog walking Jeddah",
      "house sitting pets",
      "مربي حيوانات",
    ],
  },
  "/vets": {
    path: "/vets",
    title: "Find a Vet in Saudi Arabia | Veterinary Clinics",
    description:
      "Browse veterinary clinics across " +
      CITIES +
      ". Find emergency vets, specialists, vaccinations, and routine care near you. عيادات بيطرية في السعودية.",
    keywords: [
      "vet Saudi Arabia",
      "veterinary clinic Riyadh",
      "emergency vet Riyadh",
      "animal hospital Jeddah",
      "pet vaccination",
      "عيادة بيطرية",
    ],
  },
  "/adopt": {
    path: "/adopt",
    title: "Adopt a Pet in Saudi Arabia",
    description:
      "Give a loving home to a pet in need. Browse cats, dogs, and other animals available for adoption across Saudi Arabia and submit an application online. تبني الحيوانات الأليفة.",
    keywords: [
      "pet adoption Saudi Arabia",
      "adopt a cat Riyadh",
      "adopt a dog Jeddah",
      "rescue pets Saudi Arabia",
      "تبني حيوانات",
    ],
  },
  "/lost-pets": {
    path: "/lost-pets",
    title: "Lost & Found Pets in Saudi Arabia",
    description:
      "Report a lost pet or help reunite found animals with their owners across Saudi Arabia. Search lost and found listings in " +
      CITIES +
      ". الحيوانات المفقودة.",
    keywords: [
      "lost pet Saudi Arabia",
      "found pet Riyadh",
      "lost dog Riyadh",
      "lost cat Jeddah",
      "حيوانات مفقودة",
    ],
  },
  "/travel": {
    path: "/travel",
    title: "Pet Travel Requirements for Saudi Arabia",
    description:
      "Step-by-step guide to Saudi Arabia pet import and export requirements, vaccinations, and documents for travelling with your dog or cat. السفر مع الحيوانات الأليفة.",
    keywords: [
      "pet travel Saudi Arabia",
      "pet import Saudi Arabia",
      "travelling with pets Saudi Arabia",
      "pet export requirements",
      "السفر مع الحيوانات",
    ],
  },
  "/forum": {
    path: "/forum",
    title: "Pet Owner Community Forum | Saudi Arabia",
    description:
      "Ask questions, share advice, and connect with fellow pet owners across Saudi Arabia. Discuss pet care, health, training, and local services. مجتمع محبي الحيوانات.",
    keywords: [
      "pet forum Saudi Arabia",
      "pet owners community",
      "pet care advice",
      "dog owners Riyadh",
      "منتدى الحيوانات الأليفة",
    ],
  },
  "/blog": {
    path: "/blog",
    title: "Pet Care Blog & Guides | Saudi Arabia",
    description:
      "Expert pet care tips, guides, and stories for pet owners in Saudi Arabia. Learn about pet health, nutrition, training, and travel. مدونة العناية بالحيوانات.",
    keywords: [
      "pet care tips Saudi Arabia",
      "pet care blog",
      "dog care guide",
      "cat care Saudi Arabia",
      "مدونة الحيوانات الأليفة",
    ],
  },
  "/about": {
    path: "/about",
    title: "About Saudi Petsitters",
    description:
      "Saudi Petsitters connects pet owners with trusted hosts, sitters, vets, and resources across the Kingdom. Learn about our mission to improve pet care in Saudi Arabia.",
    keywords: [
      "about Saudi Petsitters",
      "pet care community Saudi Arabia",
      "trusted pet services",
    ],
  },
  "/partners": {
    path: "/partners",
    title: "Advertise Your Pet Business in Saudi Arabia",
    description:
      "Reach Saudi Arabia's most engaged community of pet owners. Advertise your vet clinic, pet shop, grooming, training, or boarding business with Saudi Petsitters.",
    keywords: [
      "pet business advertising Saudi Arabia",
      "vet clinic marketing",
      "pet shop advertising Riyadh",
      "grooming business Saudi Arabia",
    ],
  },
  "/terms": {
    path: "/terms",
    title: "Terms & Conditions",
    description:
      "Read the terms and conditions governing the use of Saudi Petsitters services.",
  },
  "/privacy": {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "Learn how Saudi Petsitters collects, uses, and protects your personal information.",
  },
  "/disclaimer": {
    path: "/disclaimer",
    title: "Disclaimer",
    description:
      "Important disclaimers regarding the use of Saudi Petsitters and its services.",
  },
  "/liability-waiver": {
    path: "/liability-waiver",
    title: "Liability Waiver",
    description:
      "Review the liability waiver for pet hosting and care services arranged through Saudi Petsitters.",
  },
};
