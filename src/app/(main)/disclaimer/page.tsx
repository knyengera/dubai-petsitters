import Disclaimer from "@/components/pages/Disclaimer";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/disclaimer"]);

export default function Page() {
  return <Disclaimer />;
}
