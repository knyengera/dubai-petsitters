import TravelCompliance from "@/components/pages/TravelCompliance";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/travel"]);

export default function Page() {
  return <TravelCompliance />;
}
