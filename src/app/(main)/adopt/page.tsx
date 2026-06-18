import Adopt from "@/components/pages/Adopt";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/adopt"]);

export default function Page() {
  return <Adopt />;
}
