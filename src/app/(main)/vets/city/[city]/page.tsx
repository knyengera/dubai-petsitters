import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Vets from "@/components/pages/Vets";
import CityLandingIntro from "@/components/seo/CityLandingIntro";
import { SEO_CITIES, getCityBySlug } from "@/lib/seo/cities";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicVetsByCity } from "@/lib/seo/queries";
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
      title: "Vet Clinics",
      description: "Find veterinary clinics across Saudi Arabia.",
      path: `/vets/city/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `Vets in ${city.name} | Veterinary Clinics & Emergency Care`,
    description: `Find a vet in ${city.name}. Browse veterinary clinics for vaccinations, surgery, dental, and 24/7 emergency pet care. Compare clinics, ratings, and book online. عيادات بيطرية في ${city.nameAr}.`,
    path: `/vets/city/${city.slug}`,
    keywords: [
      `vet ${city.name}`,
      `veterinary clinic ${city.name}`,
      `emergency vet ${city.name}`,
      `animal hospital ${city.name}`,
      `عيادة بيطرية ${city.nameAr}`,
    ],
  });
}

export default async function Page({ params }: PageProps) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const vets = await getPublicVetsByCity(city.name);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Vets", path: "/vets" },
            { name: city.name, path: `/vets/city/${city.slug}` },
          ]),
          ...(vets.length > 0
            ? [
                itemListSchema({
                  name: `Vet Clinics in ${city.name}`,
                  items: vets.map((v) => ({
                    name: v.name,
                    path: `/vets/${v.id}`,
                  })),
                }),
              ]
            : []),
        ]}
      />
      <CityLandingIntro kind="vets" city={city} />
      <Vets defaultCity={city.name} />
    </>
  );
}
