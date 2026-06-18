import Hosting from "@/components/pages/Hosting";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/hosting"]);

export default function Page() {
  return <Hosting />;
}
