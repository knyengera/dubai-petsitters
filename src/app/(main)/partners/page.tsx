import Partners from "@/components/pages/Partners";
import { parsePartnerTypeFromSearchParams } from "@/lib/partners/partner-types";

type PageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialBusinessType = parsePartnerTypeFromSearchParams(params.type);

  return <Partners initialBusinessType={initialBusinessType} />;
}
