import LiabilityWaiver from "@/components/pages/LiabilityWaiver";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/liability-waiver"]);

export default function LiabilityWaiverPage() {
  return <LiabilityWaiver />;
}
