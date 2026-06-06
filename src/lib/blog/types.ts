export type BlogPostStatus = "draft" | "scheduled" | "published" | "trash";
export type BlogCommentStatus = "pending" | "approved" | "spam" | "trash";

export type BlogPost = {
  id: string;
  title: string;
  slug: string | null;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string | null;
  author_name: string | null;
  published: boolean;
  status: BlogPostStatus;
  published_at: string | null;
  scheduled_at: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  featured: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  created_date?: string;
  updated_date?: string;
};

export type BlogComment = {
  id: string;
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: BlogCommentStatus;
  created_at: string;
  updated_at: string;
  created_date?: string;
};

export type BlogPostFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  author_name: string;
  status: BlogPostStatus;
  scheduled_at: string;
  tags: string;
  seo_title: string;
  seo_description: string;
  featured: boolean;
};

export const BLOG_CATEGORIES = [
  { value: "pet_care", label: "Pet Care" },
  { value: "health", label: "Health" },
  { value: "training", label: "Training" },
  { value: "nutrition", label: "Nutrition" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "news", label: "News" },
] as const;

export const BLOG_STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  published: "Published",
  trash: "Trash",
};

export const BLOG_COMMENT_STATUS_LABELS: Record<BlogCommentStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  spam: "Spam",
  trash: "Trash",
};
