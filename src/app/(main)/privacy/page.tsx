import Privacy from "@/components/pages/Privacy";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/privacy"]);

export default function Page() {
  return <Privacy />;
}
