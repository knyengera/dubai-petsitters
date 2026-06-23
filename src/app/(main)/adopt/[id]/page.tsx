import type { Metadata } from "next";
import AdoptPetDetail from "@/components/pages/AdoptPetDetail";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicPetForSeo } from "@/lib/seo/queries";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/json-ld";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPublicPetForSeo(id);

  if (!pet) {
    return buildPageMetadata({
      title: "Pet Not Found",
      description: "This adoption listing is no longer available.",
      path: `/adopt/${id}`,
      noIndex: true,
    });
  }

  const name = pet.name || "Pet";
  const cityPart = pet.city ? ` in ${pet.city}` : " in the UAE";
  const breedPart = pet.breed ? `${pet.breed} ` : "";

  return buildPageMetadata({
    title: `Adopt ${name} — ${breedPart}${pet.species ?? "Pet"}${cityPart}`,
    description:
      pet.description ||
      `Meet ${name}, a ${breedPart}${pet.species ?? "pet"} available for adoption${cityPart}. View details and apply to adopt.`,
    path: `/adopt/${id}`,
    image: pet.image_url || undefined,
    keywords: [
      `adopt ${pet.species ?? "pet"} ${pet.city ?? "UAE"}`,
      "pet adoption UAE",
    ],
  });
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const pet = await getPublicPetForSeo(id);

  return (
    <>
      {pet && (
        <JsonLd
          data={[
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Adopt", path: "/adopt" },
              { name: pet.name || "Pet", path: `/adopt/${id}` },
            ]),
          ]}
        />
      )}
      <AdoptPetDetail />
    </>
  );
}
