import LostPets from "@/components/pages/LostPets";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { PAGE_SEO } from "@/lib/seo/pages";

export const metadata = buildPageMetadata(PAGE_SEO["/lost-pets"]);

export default function Page() {
  return <LostPets />;
}
