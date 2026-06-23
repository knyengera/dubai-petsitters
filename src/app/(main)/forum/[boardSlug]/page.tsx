import type { Metadata } from "next";
import { getForumBoardBySlug } from "@/lib/forum/actions";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/json-ld";
import ForumBoardRouteClient from "./ForumBoardRouteClient";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PageProps = {
  params: Promise<{ boardSlug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { boardSlug } = await params;

  if (UUID_RE.test(boardSlug)) {
    return buildPageMetadata({
      title: "Community Forum",
      description: "Dubai Petsitters pet owner community forum.",
      path: "/forum",
      noIndex: true,
    });
  }

  const result = await getForumBoardBySlug(boardSlug);
  const board = result.ok ? result.data : null;

  if (!board) {
    return buildPageMetadata({
      title: "Forum Board",
      description: "Browse discussions in the Dubai Petsitters community forum.",
      path: `/forum/${boardSlug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: `${board.title} — Pet Forum`,
    description:
      board.description ||
      `Discussions about ${board.title} from pet owners across the UAE. Ask questions and share advice.`,
    path: `/forum/${board.slug}`,
    keywords: [
      `${board.title} pet forum`,
      "pet owners community UAE",
    ],
  });
}

export default async function Page({ params }: PageProps) {
  const { boardSlug } = await params;
  const isUuid = UUID_RE.test(boardSlug);
  const result = isUuid ? null : await getForumBoardBySlug(boardSlug);
  const board = result?.ok ? result.data : null;

  return (
    <>
      {board && (
        <JsonLd
          data={breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Forum", path: "/forum" },
            { name: board.title, path: `/forum/${board.slug}` },
          ])}
        />
      )}
      <ForumBoardRouteClient />
    </>
  );
}
