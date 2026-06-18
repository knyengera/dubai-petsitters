import Deals from "@/components/pages/Deals";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/deals"]);

export default function Page() {
  return <Deals />;
}
