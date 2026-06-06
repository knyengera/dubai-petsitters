import type { BlogPost, BlogPostFormValues, BlogPostStatus } from "./types";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseTagsInput(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatTagsForInput(tags: string[] | null | undefined): string {
  return (tags ?? []).join(", ");
}

export function isPostPubliclyVisible(post: BlogPost, now = new Date()): boolean {
  const current = now.getTime();
  if (post.status === "published") {
    const publishedAt = post.published_at ?? post.created_at;
    return new Date(publishedAt).getTime() <= current;
  }
  if (post.status === "scheduled" && post.scheduled_at) {
    return new Date(post.scheduled_at).getTime() <= current;
  }
  return false;
}

export function normalizePostPayload(values: BlogPostFormValues) {
  const slug = values.slug.trim() || slugify(values.title);
  const tags = parseTagsInput(values.tags);
  const now = new Date().toISOString();
  let status: BlogPostStatus = values.status;
  let published = false;
  let published_at: string | null = null;
  let scheduled_at: string | null = null;

  if (status === "published") {
    published = true;
    published_at = now;
  } else if (status === "scheduled") {
    published = false;
    scheduled_at = values.scheduled_at
      ? new Date(values.scheduled_at).toISOString()
      : null;
    if (!scheduled_at) {
      status = "draft";
    }
  } else if (status === "draft" || status === "trash") {
    published = false;
  }

  return {
    title: values.title.trim(),
    slug,
    excerpt: values.excerpt.trim() || null,
    content: values.content,
    cover_image: values.cover_image.trim() || null,
    category: values.category || null,
    author_name: values.author_name.trim() || null,
    status,
    published,
    published_at,
    scheduled_at,
    tags,
    seo_title: values.seo_title.trim() || null,
    seo_description: values.seo_description.trim() || null,
    featured: values.featured,
    updated_at: now,
  };
}

export function postToFormValues(post: BlogPost): BlogPostFormValues {
  return {
    title: post.title ?? "",
    slug: post.slug ?? "",
    excerpt: post.excerpt ?? "",
    content: post.content ?? "",
    cover_image: post.cover_image ?? "",
    category: post.category ?? "pet_care",
    author_name: post.author_name ?? "Saudi Petsitters",
    status: post.status ?? (post.published ? "published" : "draft"),
    scheduled_at: post.scheduled_at
      ? new Date(post.scheduled_at).toISOString().slice(0, 16)
      : "",
    tags: formatTagsForInput(post.tags),
    seo_title: post.seo_title ?? "",
    seo_description: post.seo_description ?? "",
    featured: Boolean(post.featured),
  };
}

export const EMPTY_BLOG_POST_FORM: BlogPostFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image: "",
  category: "pet_care",
  author_name: "Saudi Petsitters",
  status: "draft",
  scheduled_at: "",
  tags: "",
  seo_title: "",
  seo_description: "",
  featured: false,
};
