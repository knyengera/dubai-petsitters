import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Hosts from "@/components/pages/Hosts";
import { SEO_CITIES, getCityBySlug } from "@/lib/seo/cities";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicHostsByCity } from "@/lib/seo/queries";
import { JsonLd, breadcrumbSchema, itemListSchema } from "@/lib/seo/json-ld";

type PageProps = {
  params: Promise<{ city: string }>;
};

export function generateStaticParams() {
  return SEO_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) {
    return buildPageMetadata({
      title: "Pet Sitters",
      description: "Find trusted pet sitters across Saudi Arabia.",
      path: `/hosts/city/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `Pet Sitters in ${city.name} | Boarding, Dog Walking & Cat Sitting`,
    description: `Find trusted pet sitters in ${city.name} for boarding, daycare, dog walking, and in-home pet care. Compare verified hosts, reviews, and prices on Saudi Petsitters. مربي حيوانات في ${city.nameAr}.`,
    path: `/hosts/city/${city.slug}`,
    keywords: [
      `pet sitter ${city.name}`,
      `pet boarding ${city.name}`,
      `dog walking ${city.name}`,
      `cat sitting ${city.name}`,
      `dog hotel ${city.name}`,
      `مربي حيوانات ${city.nameAr}`,
    ],
  });
}

export default async function Page({ params }: PageProps) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const hosts = await getPublicHostsByCity(city.name);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Pet Sitters", path: "/hosts" },
            { name: city.name, path: `/hosts/city/${city.slug}` },
          ]),
          ...(hosts.length > 0
            ? [
                itemListSchema({
                  name: `Pet Sitters in ${city.name}`,
                  items: hosts.map((h) => ({
                    name: h.name,
                    path: `/hosts/${h.id}`,
                  })),
                }),
              ]
            : []),
        ]}
      />
      <Hosts defaultCity={city.name} />
    </>
  );
}
