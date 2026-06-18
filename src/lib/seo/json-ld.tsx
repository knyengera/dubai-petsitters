import {
  CONTACT_EMAIL,
  SITE_NAME,
  SITE_TAGLINE,
  absoluteUrl,
} from "@/lib/seo/site";

type JsonLdObject = Record<string, unknown>;

/** Renders one or more JSON-LD blocks as <script> tags. */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  );
}

export function organizationSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo.png"),
    description: SITE_TAGLINE,
    email: CONTACT_EMAIL,
    areaServed: { "@type": "Country", name: "Saudi Arabia" },
    contactPoint: {
      "@type": "ContactPoint",
      email: CONTACT_EMAIL,
      contactType: "customer support",
      areaServed: "SA",
      availableLanguage: ["en", "ar"],
    },
  };
}

export function websiteSchema(): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: absoluteUrl("/"),
    inLanguage: ["en", "ar"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${absoluteUrl("/hosts")}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(
  items: { name: string; path: string }[]
): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function blogPostingSchema(input: {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  author?: string | null;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description ?? undefined,
    image: input.image ? [input.image] : undefined,
    datePublished: input.datePublished ?? undefined,
    dateModified: input.dateModified ?? input.datePublished ?? undefined,
    author: {
      "@type": "Person",
      name: input.author || SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo.png") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(input.path) },
  };
}

export function petSitterServiceSchema(input: {
  name: string;
  path: string;
  city?: string | null;
  services?: string[] | null;
  rating?: number | null;
  image?: string | null;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: input.name,
    url: absoluteUrl(input.path),
    image: input.image ?? undefined,
    address: input.city
      ? {
          "@type": "PostalAddress",
          addressLocality: input.city,
          addressCountry: "SA",
        }
      : undefined,
    areaServed: input.city
      ? { "@type": "City", name: input.city }
      : { "@type": "Country", name: "Saudi Arabia" },
    makesOffer: input.services?.map((service) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: service },
    })),
    aggregateRating:
      input.rating != null && input.rating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: input.rating,
            bestRating: 5,
          }
        : undefined,
  };
}

export function veterinaryCareSchema(input: {
  name: string;
  path: string;
  city?: string | null;
  address?: string | null;
  services?: string[] | null;
  rating?: number | null;
  image?: string | null;
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "VeterinaryCare",
    name: input.name,
    url: absoluteUrl(input.path),
    image: input.image ?? undefined,
    address:
      input.address || input.city
        ? {
            "@type": "PostalAddress",
            streetAddress: input.address ?? undefined,
            addressLocality: input.city ?? undefined,
            addressCountry: "SA",
          }
        : undefined,
    areaServed: input.city
      ? { "@type": "City", name: input.city }
      : { "@type": "Country", name: "Saudi Arabia" },
    availableService: input.services?.map((service) => ({
      "@type": "MedicalProcedure",
      name: service,
    })),
    aggregateRating:
      input.rating != null && input.rating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: input.rating,
            bestRating: 5,
          }
        : undefined,
  };
}

export function itemListSchema(input: {
  name: string;
  items: { name: string; path: string }[];
}): JsonLdObject {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    itemListElement: input.items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: absoluteUrl(item.path),
    })),
  };
}
