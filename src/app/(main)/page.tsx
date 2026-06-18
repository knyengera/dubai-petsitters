import Home from "@/components/pages/Home";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/"]);

export default function Page() {
  return <Home />;
}
