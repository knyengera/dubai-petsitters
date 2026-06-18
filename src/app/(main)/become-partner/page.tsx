import BecomePartner from "@/components/pages/BecomePartner";
import { parsePartnerTypeFromSearchParams } from "@/lib/partners/partner-types";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/become-partner"]);

type PageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialBusinessType = parsePartnerTypeFromSearchParams(params.type);

  return <BecomePartner initialBusinessType={initialBusinessType} />;
}
