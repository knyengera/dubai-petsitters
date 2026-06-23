import type { Metadata } from "next";
import BlogPost from "@/components/pages/BlogPost";
import { getPublicBlogPostBySlug } from "@/lib/blog/actions";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { JsonLd, blogPostingSchema, breadcrumbSchema } from "@/lib/seo/json-ld";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicBlogPostBySlug(slug);

  if (result.ok === false || !result.data) {
    return buildPageMetadata({
      title: "Article Not Found",
      description: "This blog article is no longer available.",
      path: `/blog/${slug}`,
      noIndex: true,
    });
  }

  const post = result.data;
  return buildPageMetadata({
    title: post.seo_title || post.title,
    description:
      post.seo_description ||
      post.excerpt ||
      `Read "${post.title}" on the Dubai Petsitters pet care blog.`,
    path: `/blog/${post.slug ?? slug}`,
    type: "article",
    image: post.cover_image || undefined,
    keywords: post.tags ?? undefined,
    article: {
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      authors: post.author_name ? [post.author_name] : undefined,
      tags: post.tags ?? undefined,
    },
  });
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const result = await getPublicBlogPostBySlug(slug);
  const post = result.ok ? result.data : null;

  return (
    <>
      {post && (
        <JsonLd
          data={[
            blogPostingSchema({
              title: post.title,
              description: post.seo_description || post.excerpt,
              path: `/blog/${post.slug ?? slug}`,
              image: post.cover_image,
              datePublished: post.published_at ?? post.created_at,
              dateModified: post.updated_at,
              author: post.author_name,
            }),
            breadcrumbSchema([
              { name: "Home", path: "/" },
              { name: "Blog", path: "/blog" },
              { name: post.title, path: `/blog/${post.slug ?? slug}` },
            ]),
          ]}
        />
      )}
      <BlogPost slug={slug} />
    </>
  );
}
