import type { Metadata } from "next";
import HostDetail from "@/components/pages/HostDetail";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicHostForSeo } from "@/lib/seo/queries";
import {
  JsonLd,
  breadcrumbSchema,
  petSitterServiceSchema,
} from "@/lib/seo/json-ld";
import { SITE_NAME } from "@/lib/seo/site";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatServices(services: string[] | null): string {
  if (!services || services.length === 0) return "boarding, daycare, and pet care";
  return services.map((s) => s.replace(/_/g, " ")).join(", ");
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const host = await getPublicHostForSeo(id);

  if (!host) {
    return buildPageMetadata({
      title: "Pet Host Not Found",
      description: "This pet host profile is no longer available.",
      path: `/hosts/${id}`,
      noIndex: true,
    });
  }

  const name = host.full_name || "Pet Host";
  const cityPart = host.city ? ` in ${host.city}` : " in the UAE";
  const services = formatServices(host.services);

  return buildPageMetadata({
    title: `${name} — Pet Sitter${cityPart}`,
    description: `Book ${name}, a trusted pet sitter${cityPart} offering ${services}. View reviews, availability, and pricing on ${SITE_NAME}.`,
    path: `/hosts/${id}`,
    type: "profile",
    image: host.photo_url || undefined,
    keywords: [
      `pet sitter ${host.city ?? "the UAE"}`,
      `pet boarding ${host.city ?? "the UAE"}`,
      "trusted pet host",
    ],
  });
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const host = await getPublicHostForSeo(id);

  return (
    <>
      {host && (
        <JsonLd
          data={[
            petSitterServiceSchema({
              name: host.full_name || "Pet Host",
              path: `/hosts/${id}`,
              city: host.city,
              services: host.services,
              rating: host.rating,
              image: host.photo_url,
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Pet Sitters", path: "/hosts" },
              { name: host.full_name || "Host", path: `/hosts/${id}` },
            ]),
          ]}
        />
      )}
      <HostDetail />
    </>
  );
}
