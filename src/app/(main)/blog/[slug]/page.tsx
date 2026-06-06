import type { Metadata } from "next";
import BlogPost from "@/components/pages/BlogPost";
import { getPublicBlogPostBySlug } from "@/lib/blog/actions";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicBlogPostBySlug(slug);

  if (result.ok === false || !result.data) {
    return { title: "Article Not Found | Saudi Petsitters" };
  }

  const post = result.data;
  return {
    title: post.seo_title || `${post.title} | Saudi Petsitters Blog`,
    description: post.seo_description || post.excerpt || undefined,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || undefined,
      images: post.cover_image ? [post.cover_image] : undefined,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <BlogPost slug={slug} />;
}
