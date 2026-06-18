import type { Metadata } from "next";
import { redirect } from "next/navigation";
import PartnerDetail from "@/components/pages/PartnerDetail";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicPartnerForSeo } from "@/lib/seo/queries";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/json-ld";
import { VET_BUSINESS_TYPE_LABEL } from "@/lib/partners/queries";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const partner = await getPublicPartnerForSeo(id);

  if (!partner) {
    return buildPageMetadata({
      title: "Partner Not Found",
      description: "This partner business listing is no longer available.",
      path: `/partners/${id}`,
      noIndex: true,
    });
  }

  const name = partner.name || "Pet Business";
  const typePart = partner.business_type ? ` — ${partner.business_type}` : "";
  const cityPart = partner.city ? ` in ${partner.city}` : " in Saudi Arabia";

  return buildPageMetadata({
    title: `${name}${typePart}${cityPart}`,
    description: `${name} is a ${partner.business_type || "pet business"}${cityPart}. View services, location, and contact details.`,
    path: `/partners/${id}`,
    image: partner.image_url || undefined,
    keywords: [
      `${partner.business_type ?? "pet business"} ${partner.city ?? "Saudi Arabia"}`,
      `pet services ${partner.city ?? "Saudi Arabia"}`,
    ],
  });
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const partner = await getPublicPartnerForSeo(id);

  if (partner && partner.business_type === VET_BUSINESS_TYPE_LABEL) {
    redirect(`/vets/${id}`);
  }

  return (
    <>
      {partner && (
        <JsonLd
          data={[
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Partners", path: "/partners" },
              { name: partner.name || "Partner", path: `/partners/${id}` },
            ]),
          ]}
        />
      )}
      <PartnerDetail />
    </>
  );
}
