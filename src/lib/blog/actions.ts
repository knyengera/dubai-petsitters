"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";
import type { BlogComment, BlogPost } from "./types";

export type BlogActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function getPublicBlogPosts(): Promise<BlogActionResult<BlogPost[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .in("status", ["published", "scheduled"])
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) return { ok: false, error: error.message };

    const posts = (data ?? []) as BlogPost[];
    const visible = posts.filter((post) => {
      if (post.status === "published") {
        const publishedAt = post.published_at ?? post.created_at;
        return new Date(publishedAt).getTime() <= Date.now();
      }
      if (post.status === "scheduled" && post.scheduled_at) {
        return new Date(post.scheduled_at).getTime() <= Date.now();
      }
      return false;
    });

    return { ok: true, data: visible };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getPublicBlogPostBySlug(
  slug: string
): Promise<BlogActionResult<BlogPost | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: true, data: null };

    const post = data as BlogPost;
    const publishedAt = post.published_at ?? post.created_at;
    const isVisible =
      (post.status === "published" &&
        new Date(publishedAt).getTime() <= Date.now()) ||
      (post.status === "scheduled" &&
        post.scheduled_at &&
        new Date(post.scheduled_at).getTime() <= Date.now());

    if (!isVisible) return { ok: true, data: null };
    return { ok: true, data: post };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getPublicBlogComments(
  postId: string
): Promise<BlogActionResult<BlogComment[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_comments")
      .select("*")
      .eq("post_id", postId)
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as BlogComment[] };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function submitBlogComment(payload: {
  post_id: string;
  author_name: string;
  author_email: string;
  content: string;
}): Promise<BlogActionResult<BlogComment>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_comments")
      .insert({
        post_id: payload.post_id,
        author_name: payload.author_name.trim(),
        author_email: payload.author_email.trim(),
        content: payload.content.trim(),
        status: "pending",
      } as never)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/blog");
    return { ok: true, data: data as BlogComment };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminListBlogComments(
  postId?: string
): Promise<BlogActionResult<BlogComment[]>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    let query = supabase
      .from("blog_comments")
      .select("*")
      .order("created_at", { ascending: false });

    if (postId) query = query.eq("post_id", postId);

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as BlogComment[] };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminModerateBlogComment(
  id: string,
  status: BlogComment["status"]
): Promise<BlogActionResult<BlogComment>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("blog_comments")
      .update({ status, updated_at: new Date().toISOString() } as never)
      .eq("id", id)
      .select()
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { ok: true, data: data as BlogComment };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminDeleteBlogComment(
  id: string
): Promise<BlogActionResult<null>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("blog_comments").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}
