import Terms from "@/components/pages/Terms";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/terms"]);

export default function Page() {
  return <Terms />;
}
