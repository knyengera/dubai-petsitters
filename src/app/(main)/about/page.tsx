import About from "@/components/pages/About";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/about"]);

export default function Page() {
  return <About />;
}
