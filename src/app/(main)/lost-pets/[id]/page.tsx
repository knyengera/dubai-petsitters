import type { Metadata } from "next";
import LostPetDetail from "@/components/pages/LostPetDetail";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicLostPetForSeo } from "@/lib/seo/queries";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/json-ld";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPublicLostPetForSeo(id);

  if (!pet) {
    return buildPageMetadata({
      title: "Lost Pet Report Not Found",
      description: "This lost pet report is no longer available.",
      path: `/lost-pets/${id}`,
      noIndex: true,
    });
  }

  const name = pet.pet_name || "Pet";
  const cityPart = pet.city ? ` in ${pet.city}` : " in Saudi Arabia";
  const statusWord = pet.status === "found" ? "Found" : "Lost";

  return buildPageMetadata({
    title: `${statusWord}: ${name}${cityPart}`,
    description:
      pet.description ||
      `${statusWord} ${pet.species ?? "pet"} ${name}${cityPart}. View the report details and contact the owner.`,
    path: `/lost-pets/${id}`,
    image: pet.image_url || undefined,
    keywords: [
      `lost pet ${pet.city ?? "Saudi Arabia"}`,
      `found pet ${pet.city ?? "Saudi Arabia"}`,
    ],
  });
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const pet = await getPublicLostPetForSeo(id);

  return (
    <>
      {pet && (
        <JsonLd
          data={[
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Lost Pets", path: "/lost-pets" },
              { name: pet.pet_name || "Report", path: `/lost-pets/${id}` },
            ]),
          ]}
        />
      )}
      <LostPetDetail />
    </>
  );
}
