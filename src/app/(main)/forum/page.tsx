import ForumHome from "@/components/pages/ForumHome";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/forum"]);

export default function Page() {
  return <ForumHome />;
}
