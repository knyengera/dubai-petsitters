import Partners from "@/components/pages/Partners";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/partners"]);

export default function Page() {
  return <Partners />;
}
