import type { Metadata } from "next";
import ForumTopicPage from "@/components/pages/ForumTopicPage";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getPublicForumTopicForSeo } from "@/lib/seo/queries";
import { JsonLd, breadcrumbSchema } from "@/lib/seo/json-ld";

type PageProps = {
  params: Promise<{ boardSlug: string; topicSlug: string }>;
};

function toExcerpt(content: string | null, fallback: string): string {
  if (!content) return fallback;
  const text = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return fallback;
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { boardSlug, topicSlug } = await params;
  const topic = await getPublicForumTopicForSeo(boardSlug, topicSlug);

  if (!topic || !topic.title) {
    return buildPageMetadata({
      title: "Forum Topic",
      description: "Join the conversation in the Saudi Petsitters community forum.",
      path: `/forum/${boardSlug}/${topicSlug}`,
      noIndex: true,
    });
  }

  const boardSuffix = topic.boardTitle ? ` | ${topic.boardTitle}` : "";

  return buildPageMetadata({
    title: `${topic.title}${boardSuffix}`,
    description: toExcerpt(
      topic.content,
      `Read and join the discussion "${topic.title}" in the Saudi Petsitters pet owner community.`
    ),
    path: `/forum/${boardSlug}/${topicSlug}`,
    type: "article",
    article: {
      publishedTime: topic.created_at ?? undefined,
      modifiedTime: topic.updated_at ?? undefined,
      authors: topic.author_name ? [topic.author_name] : undefined,
    },
  });
}

export default async function Page({ params }: PageProps) {
  const { boardSlug, topicSlug } = await params;
  const topic = await getPublicForumTopicForSeo(boardSlug, topicSlug);

  return (
    <>
      {topic?.title && (
        <JsonLd
          data={breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Forum", path: "/forum" },
            {
              name: topic.boardTitle || "Board",
              path: `/forum/${boardSlug}`,
            },
            { name: topic.title, path: `/forum/${boardSlug}/${topicSlug}` },
          ])}
        />
      )}
      <ForumTopicPage />
    </>
  );
}
