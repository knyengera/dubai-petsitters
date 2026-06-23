import type { BuildMetadataInput } from "@/lib/seo/metadata";

export type PageSeo = Omit<BuildMetadataInput, "path"> & { path: string };

const CITIES = "Dubai, Abu Dhabi, Sharjah & Al Ain";

/**
 * Per-route SEO copy for static public pages. Titles omit the brand suffix
 * (the layout template appends "| Dubai Petsitters") unless absoluteTitle is set.
 * Descriptions weave in city names and Arabic keywords for UAE local search.
 */
export const PAGE_SEO: Record<string, PageSeo> = {
  "/": {
    path: "/",
    absoluteTitle: true,
    title: "Dubai Petsitters | Pet Sitting, Boarding & Vets in the UAE",
    description:
      "Find trusted pet sitters, boarding, dog walking, and veterinary clinics across the UAE. Book in-home pet care in Dubai, Abu Dhabi, Sharjah & Al Ain. استضافة وفندقة الحيوانات الأليفة.",
    keywords: [
      "pet sitting UAE",
      "pet boarding Dubai",
      "pet sitter Dubai",
      "dog walking Dubai",
      "cat sitting Dubai",
      "find a vet UAE",
      "استضافة حيوانات",
      "فندقة حيوانات أليفة",
    ],
  },
  "/hosting": {
    path: "/hosting",
    title: "Pet Hosting & Boarding in the UAE",
    description:
      "Trusted pet hosting, boarding, daycare, and in-home sitting while you travel. Browse verified hosts in " +
      CITIES +
      ". فندقة واستضافة الحيوانات الأليفة في الإمارات.",
    keywords: [
      "pet boarding UAE",
      "pet hosting Dubai",
      "dog hotel Dubai",
      "pet daycare Abu Dhabi",
      "in-home pet care",
      "فندقة حيوانات",
    ],
  },
  "/hosts": {
    path: "/hosts",
    title: "Find a Pet Sitter in the UAE",
    description:
      "Browse trusted, verified pet sitters and hosts for boarding, daycare, dog walking, and home sitting across " +
      CITIES +
      ". Book the perfect care for your pet. مربي حيوانات موثوق.",
    keywords: [
      "pet sitter UAE",
      "pet sitter Dubai",
      "cat sitting Dubai",
      "dog walking Abu Dhabi",
      "house sitting pets",
      "مربي حيوانات",
    ],
  },
  "/vets": {
    path: "/vets",
    title: "Find a Vet in the UAE | Veterinary Clinics",
    description:
      "Browse veterinary clinics across " +
      CITIES +
      ". Find emergency vets, specialists, vaccinations, and routine care near you. عيادات بيطرية في الإمارات.",
    keywords: [
      "vet UAE",
      "veterinary clinic Dubai",
      "emergency vet Dubai",
      "animal hospital Abu Dhabi",
      "pet vaccination",
      "عيادة بيطرية",
    ],
  },
  "/adopt": {
    path: "/adopt",
    title: "Adopt a Pet in the UAE",
    description:
      "Give a loving home to a pet in need. Browse cats, dogs, and other animals available for adoption across the UAE and submit an application online. تبني الحيوانات الأليفة.",
    keywords: [
      "pet adoption UAE",
      "adopt a cat Dubai",
      "adopt a dog Abu Dhabi",
      "rescue pets UAE",
      "تبني حيوانات",
    ],
  },
  "/lost-pets": {
    path: "/lost-pets",
    title: "Lost & Found Pets in the UAE",
    description:
      "Report a lost pet or help reunite found animals with their owners across the UAE. Search lost and found listings in " +
      CITIES +
      ". الحيوانات المفقودة.",
    keywords: [
      "lost pet UAE",
      "found pet Dubai",
      "lost dog Dubai",
      "lost cat Abu Dhabi",
      "حيوانات مفقودة",
    ],
  },
  "/travel": {
    path: "/travel",
    title: "Pet Travel Requirements for the UAE",
    description:
      "Step-by-step guide to UAE pet import and export requirements, vaccinations, and documents for travelling with your dog or cat. السفر مع الحيوانات الأليفة.",
    keywords: [
      "pet travel UAE",
      "pet import UAE",
      "travelling with pets UAE",
      "pet export requirements",
      "السفر مع الحيوانات",
    ],
  },
  "/forum": {
    path: "/forum",
    title: "Pet Owner Community Forum | UAE",
    description:
      "Ask questions, share advice, and connect with fellow pet owners across the UAE. Discuss pet care, health, training, and local services. مجتمع محبي الحيوانات.",
    keywords: [
      "pet forum UAE",
      "pet owners community",
      "pet care advice",
      "dog owners Dubai",
      "منتدى الحيوانات الأليفة",
    ],
  },
  "/blog": {
    path: "/blog",
    title: "Pet Care Blog & Guides | UAE",
    description:
      "Expert pet care tips, guides, and stories for pet owners in the UAE. Learn about pet health, nutrition, training, and travel. مدونة العناية بالحيوانات.",
    keywords: [
      "pet care tips UAE",
      "pet care blog",
      "dog care guide",
      "cat care UAE",
      "مدونة الحيوانات الأليفة",
    ],
  },
  "/about": {
    path: "/about",
    title: "About Dubai Petsitters",
    description:
      "Dubai Petsitters connects pet owners with trusted hosts, sitters, vets, and resources across the UAE. Learn about our mission to improve pet care in the UAE.",
    keywords: [
      "about Dubai Petsitters",
      "pet care community UAE",
      "trusted pet services",
    ],
  },
  "/partners": {
    path: "/partners",
    title: "Pet Business Partners in the UAE | Shops, Groomers & More",
    description:
      "Discover trusted pet businesses across the UAE — pet shops, groomers, trainers, breeders, insurance, and more. Browse partners by city and service.",
    keywords: [
      "pet business directory UAE",
      "pet shop Dubai",
      "pet groomer Abu Dhabi",
      "dog trainer UAE",
      "pet insurance UAE",
    ],
  },
  "/deals": {
    path: "/deals",
    title: "Pet Deals & Discounts in the UAE | Member Offers",
    description:
      "Exclusive deals and discount codes from trusted pet partners across " +
      CITIES +
      ". Save on pet shops, grooming, vet care, food, and insurance. Sign in to reveal member promo codes.",
    keywords: [
      "pet deals UAE",
      "pet discounts Dubai",
      "pet shop offers Abu Dhabi",
      "grooming discount UAE",
      "pet promo codes",
      "عروض الحيوانات الأليفة",
    ],
  },
  "/become-partner": {
    path: "/become-partner",
    title: "Advertise Your Pet Business in the UAE",
    description:
      "Reach the UAE's most engaged community of pet owners. Advertise your vet clinic, pet shop, grooming, training, or boarding business with Dubai Petsitters.",
    keywords: [
      "pet business advertising UAE",
      "vet clinic marketing",
      "pet shop advertising Dubai",
      "grooming business UAE",
    ],
  },
  "/terms": {
    path: "/terms",
    title: "Terms & Conditions",
    description:
      "Read the terms and conditions governing the use of Dubai Petsitters services.",
  },
  "/privacy": {
    path: "/privacy",
    title: "Privacy Policy",
    description:
      "Learn how Dubai Petsitters collects, uses, and protects your personal information.",
  },
  "/disclaimer": {
    path: "/disclaimer",
    title: "Disclaimer",
    description:
      "Important disclaimers regarding the use of Dubai Petsitters and its services.",
  },
  "/liability-waiver": {
    path: "/liability-waiver",
    title: "Liability Waiver",
    description:
      "Review the liability waiver for pet hosting and care services arranged through Dubai Petsitters.",
  },
};
