import type { Metadata } from "next";
import VetDetail from "@/components/pages/VetDetail";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicVetForSeo } from "@/lib/seo/queries";
import {
  JsonLd,
  breadcrumbSchema,
  veterinaryCareSchema,
} from "@/lib/seo/json-ld";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const clinic = await getPublicVetForSeo(id);

  if (!clinic) {
    return buildPageMetadata({
      title: "Vet Clinic Not Found",
      description: "This veterinary clinic listing is no longer available.",
      path: `/vets/${id}`,
      noIndex: true,
    });
  }

  const name = clinic.name || "Vet Clinic";
  const cityPart = clinic.city ? ` in ${clinic.city}` : " in Saudi Arabia";
  const emergency = clinic.emergency_available
    ? " Offering 24/7 emergency care."
    : "";

  return buildPageMetadata({
    title: `${name} — Vet Clinic${cityPart}`,
    description: `${name} is a veterinary clinic${cityPart}. View services, location, opening hours, and book an appointment.${emergency}`,
    path: `/vets/${id}`,
    image: clinic.image_url || undefined,
    keywords: [
      `vet ${clinic.city ?? "Saudi Arabia"}`,
      `veterinary clinic ${clinic.city ?? "Saudi Arabia"}`,
      clinic.emergency_available ? "emergency vet" : "animal clinic",
    ],
  });
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const clinic = await getPublicVetForSeo(id);

  return (
    <>
      {clinic && (
        <JsonLd
          data={[
            veterinaryCareSchema({
              name: clinic.name || "Vet Clinic",
              path: `/vets/${id}`,
              city: clinic.city,
              address: clinic.address,
              services: clinic.services,
              rating: clinic.rating,
              image: clinic.image_url,
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Vets", path: "/vets" },
              { name: clinic.name || "Clinic", path: `/vets/${id}` },
            ]),
          ]}
        />
      )}
      <VetDetail />
    </>
  );
}
