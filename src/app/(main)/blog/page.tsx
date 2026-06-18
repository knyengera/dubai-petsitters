import Blog from "@/components/pages/Blog";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/blog"]);

export default function Page() {
  return <Blog />;
}
