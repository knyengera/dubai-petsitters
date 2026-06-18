import Vets from "@/components/pages/Vets";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/vets"]);

export default function Page() {
  return <Vets />;
}
