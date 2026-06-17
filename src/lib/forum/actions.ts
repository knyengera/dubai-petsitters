"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin, getSessionUser } from "@/lib/admin/auth";
import { FORUM_PAGE_SIZE, slugify } from "@/lib/forum/config";
import type {
  ForumBoard,
  ForumModerationStatus,
  ForumReply,
  ForumReport,
  ForumReportReason,
  ForumReportStatus,
  ForumStats,
  ForumTopic,
} from "@/lib/forum/types";

export type ForumActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toError(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

async function getProfileForUser(userId: string, email: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  return {
    name:
      (data as { full_name?: string } | null)?.full_name ||
      email.split("@")[0],
    avatar_url: (data as { avatar_url?: string } | null)?.avatar_url ?? null,
  };
}

function nestReplies(flat: ForumReply[]): ForumReply[] {
  const map = new Map<string, ForumReply>();
  const roots: ForumReply[] = [];
  flat.forEach((r) => map.set(r.id, { ...r, children: [] }));
  map.forEach((reply) => {
    if (reply.parent_id && map.has(reply.parent_id)) {
      map.get(reply.parent_id)!.children!.push(reply);
    } else {
      roots.push(reply);
    }
  });
  return roots;
}

export async function getForumBoards(): Promise<ForumActionResult<ForumBoard[]>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_boards")
      .select("*")
      .eq("is_visible", true)
      .order("display_order", { ascending: true })
      .order("title", { ascending: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as ForumBoard[] };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getForumBoardBySlug(
  slug: string
): Promise<ForumActionResult<ForumBoard | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_boards")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: data as ForumBoard | null };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getForumTopics(params: {
  boardSlug?: string;
  search?: string;
  page?: number;
  sort?: "latest" | "popular" | "replies";
}): Promise<
  ForumActionResult<{ topics: ForumTopic[]; total: number; page: number }>
> {
  try {
    const supabase = await createClient();
    const page = Math.max(1, params.page ?? 1);
    const from = (page - 1) * FORUM_PAGE_SIZE;
    const to = from + FORUM_PAGE_SIZE - 1;

    let boardId: string | null = null;
    if (params.boardSlug) {
      const boardResult = await getForumBoardBySlug(params.boardSlug);
      if (boardResult.ok === false) return boardResult;
      if (!boardResult.data) return { ok: true, data: { topics: [], total: 0, page } };
      boardId = boardResult.data.id;
    }

    let query = supabase
      .from("forum_topics")
      .select("*, board:forum_boards(*)", { count: "exact" })
      .eq("moderation_status", "approved");

    if (boardId) query = query.eq("board_id", boardId);
    if (params.search?.trim()) {
      query = query.or(
        `title.ilike.%${params.search.trim()}%,content.ilike.%${params.search.trim()}%`
      );
    }

    if (params.sort === "popular") {
      query = query.order("reaction_count", { ascending: false });
    } else if (params.sort === "replies") {
      query = query.order("reply_count", { ascending: false });
    } else {
      query = query
        .order("pinned", { ascending: false })
        .order("last_reply_at", { ascending: false, nullsFirst: false });
    }

    const { data, error, count } = await query.range(from, to);
    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      data: {
        topics: (data ?? []) as ForumTopic[],
        total: count ?? 0,
        page,
      },
    };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getForumTopic(params: {
  boardSlug: string;
  topicSlug: string;
}): Promise<ForumActionResult<ForumTopic | null>> {
  try {
    const supabase = await createClient();
    const boardResult = await getForumBoardBySlug(params.boardSlug);
    if (boardResult.ok === false) return boardResult;
    if (!boardResult.data) return { ok: true, data: null };

    const { data, error } = await supabase
      .from("forum_topics")
      .select("*, board:forum_boards(*)")
      .eq("board_id", boardResult.data.id)
      .eq("slug", params.topicSlug)
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: true, data: null };

    const topic = data as ForumTopic;
    if (topic.moderation_status !== "approved") {
      const user = await getSessionUser();
      const isAuthor = user?.email === topic.author_email;
      const isAdmin =
        (user?.app_metadata?.role as string | undefined) === "admin";
      if (!isAuthor && !isAdmin) return { ok: true, data: null };
    }

    await supabase
      .from("forum_topics")
      .update({ view_count: (topic.view_count ?? 0) + 1 } as never)
      .eq("id", topic.id);

    return { ok: true, data: topic };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getForumTopicById(
  id: string
): Promise<ForumActionResult<ForumTopic | null>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_topics")
      .select("*, board:forum_boards(*)")
      .eq("id", id)
      .maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: true, data: null };
    const topic = data as ForumTopic;
    if (topic.moderation_status !== "approved") {
      const user = await getSessionUser();
      const isAuthor = user?.email === topic.author_email;
      const isAdmin =
        (user?.app_metadata?.role as string | undefined) === "admin";
      if (!isAuthor && !isAdmin) return { ok: true, data: null };
    }
    return { ok: true, data: topic };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getForumReplies(
  topicId: string
): Promise<ForumActionResult<ForumReply[]>> {
  try {
    const supabase = await createClient();
    const user = await getSessionUser();
    const isAdmin = (user?.app_metadata?.role as string | undefined) === "admin";

    let query = supabase
      .from("forum_replies")
      .select("*")
      .eq("topic_id", topicId)
      .order("created_at", { ascending: true });

    if (!isAdmin) {
      query = query.or(
        `moderation_status.eq.approved,author_email.eq.${user?.email ?? "___none___"}`
      );
    }

    const { data, error } = await query;
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: nestReplies((data ?? []) as ForumReply[]) };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getForumStats(): Promise<ForumActionResult<ForumStats>> {
  try {
    const supabase = await createClient();
    const [boards, topics, replies, users] = await Promise.all([
      supabase.from("forum_boards").select("*", { count: "exact", head: true }),
      supabase
        .from("forum_topics")
        .select("*", { count: "exact", head: true })
        .eq("moderation_status", "approved"),
      supabase
        .from("forum_replies")
        .select("*", { count: "exact", head: true })
        .eq("moderation_status", "approved"),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);
    return {
      ok: true,
      data: {
        boards: boards.count ?? 0,
        topics: topics.count ?? 0,
        replies: replies.count ?? 0,
        registered_users: users.count ?? 0,
      },
    };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getRecentForumReplies(
  limit = 8
): Promise<
  ForumActionResult<
    (ForumReply & { topic?: { title: string; slug: string; board?: ForumBoard } })[]
  >
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_replies")
      .select("*, topic:forum_topics(title, slug, board:forum_boards(slug, title))")
      .eq("moderation_status", "approved")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: (data ?? []) as never };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function submitForumTopic(payload: {
  board_id: string;
  title: string;
  content: string;
}): Promise<ForumActionResult<ForumTopic>> {
  try {
    const user = await getSessionUser();
    if (!user?.email) return { ok: false, error: "Sign in required" };

    const profile = await getProfileForUser(user.id, user.email);
    const baseSlug = slugify(payload.title) || "topic";
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("forum_topics")
      .insert({
        board_id: payload.board_id,
        title: payload.title.trim(),
        slug: `${baseSlug}-${Date.now().toString(36)}`,
        content: payload.content.trim(),
        author_id: user.id,
        author_name: profile.name,
        author_email: user.email,
        author_avatar_url: profile.avatar_url,
        moderation_status: "pending",
      } as never)
      .select("*, board:forum_boards(*)")
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/forum");
    return { ok: true, data: data as ForumTopic };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function submitForumReply(payload: {
  topic_id: string;
  content: string;
  parent_id?: string | null;
}): Promise<ForumActionResult<ForumReply>> {
  try {
    const user = await getSessionUser();
    if (!user?.email) return { ok: false, error: "Sign in required" };

    const profile = await getProfileForUser(user.id, user.email);
    const supabase = await createClient();

    const { data: topic } = await supabase
      .from("forum_topics")
      .select("locked, moderation_status")
      .eq("id", payload.topic_id)
      .maybeSingle();

    if (!topic) return { ok: false, error: "Topic not found" };
    if ((topic as { locked?: boolean }).locked) {
      return { ok: false, error: "This topic is locked" };
    }

    const { data, error } = await supabase
      .from("forum_replies")
      .insert({
        topic_id: payload.topic_id,
        parent_id: payload.parent_id ?? null,
        content: payload.content.trim(),
        author_id: user.id,
        author_name: profile.name,
        author_email: user.email,
        author_avatar_url: profile.avatar_url,
        moderation_status: "pending",
      } as never)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/forum");
    return { ok: true, data: data as ForumReply };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function toggleForumReaction(payload: {
  target_type: "topic" | "reply";
  target_id: string;
}): Promise<ForumActionResult<{ reacted: boolean; count: number }>> {
  try {
    const user = await getSessionUser();
    if (!user?.email) return { ok: false, error: "Sign in required" };

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("forum_reactions")
      .select("id")
      .eq("target_type", payload.target_type)
      .eq("target_id", payload.target_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("forum_reactions")
        .delete()
        .eq("id", (existing as { id: string }).id);
    } else {
      await supabase.from("forum_reactions").insert({
        target_type: payload.target_type,
        target_id: payload.target_id,
        user_id: user.id,
        user_email: user.email,
        reaction_type: "upvote",
      } as never);
    }

    const { count } = await supabase
      .from("forum_reactions")
      .select("*", { count: "exact", head: true })
      .eq("target_type", payload.target_type)
      .eq("target_id", payload.target_id);

    const table = payload.target_type === "topic" ? "forum_topics" : "forum_replies";
    await supabase
      .from(table)
      .update({ reaction_count: count ?? 0 } as never)
      .eq("id", payload.target_id);

    revalidatePath("/forum");
    return { ok: true, data: { reacted: !existing, count: count ?? 0 } };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function reportForumContent(payload: {
  target_type: "topic" | "reply";
  target_id: string;
  reason: ForumReportReason;
  details?: string;
}): Promise<ForumActionResult<ForumReport>> {
  try {
    const user = await getSessionUser();
    if (!user?.email) return { ok: false, error: "Sign in required" };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_reports")
      .insert({
        target_type: payload.target_type,
        target_id: payload.target_id,
        reporter_id: user.id,
        reporter_email: user.email,
        reason: payload.reason,
        details: payload.details?.trim() || null,
        status: "pending",
      } as never)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/forum");
    return { ok: true, data: data as ForumReport };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function toggleForumSubscription(payload: {
  target_type: "board" | "topic";
  target_id: string;
}): Promise<ForumActionResult<{ subscribed: boolean }>> {
  try {
    const user = await getSessionUser();
    if (!user?.email) return { ok: false, error: "Sign in required" };

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("forum_subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("target_type", payload.target_type)
      .eq("target_id", payload.target_id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("forum_subscriptions")
        .delete()
        .eq("id", (existing as { id: string }).id);
      return { ok: true, data: { subscribed: false } };
    }

    await supabase.from("forum_subscriptions").insert({
      user_id: user.id,
      user_email: user.email,
      target_type: payload.target_type,
      target_id: payload.target_id,
    } as never);

    return { ok: true, data: { subscribed: true } };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function toggleForumBookmark(
  topicId: string
): Promise<ForumActionResult<{ bookmarked: boolean }>> {
  try {
    const user = await getSessionUser();
    if (!user?.email) return { ok: false, error: "Sign in required" };

    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("forum_bookmarks")
      .select("id")
      .eq("user_id", user.id)
      .eq("topic_id", topicId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("forum_bookmarks")
        .delete()
        .eq("id", (existing as { id: string }).id);
      return { ok: true, data: { bookmarked: false } };
    }

    await supabase.from("forum_bookmarks").insert({
      user_id: user.id,
      user_email: user.email,
      topic_id: topicId,
    } as never);

    return { ok: true, data: { bookmarked: true } };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function getUserForumReactions(
  targetType: "topic" | "reply",
  targetIds: string[]
): Promise<ForumActionResult<string[]>> {
  try {
    const user = await getSessionUser();
    if (!user) return { ok: true, data: [] };
    if (targetIds.length === 0) return { ok: true, data: [] };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_reactions")
      .select("target_id")
      .eq("target_type", targetType)
      .eq("user_id", user.id)
      .in("target_id", targetIds);

    if (error) return { ok: false, error: error.message };
    return {
      ok: true,
      data: (data ?? []).map((r) => String((r as { target_id: string }).target_id)),
    };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

// ---------------------------------------------------------------------------
// Admin actions
// ---------------------------------------------------------------------------

export type AdminForumListParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  filters?: Record<string, string>;
};

function resolveAdminForumRange(params: AdminForumListParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.max(1, params.pageSize ?? 20);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
}

function sanitizeForumSearch(search?: string): string {
  return (search ?? "").trim().replace(/[%,()]/g, " ").trim();
}

export async function adminListForumTopics(
  params: AdminForumListParams = {}
): Promise<ForumActionResult<{ rows: ForumTopic[]; total: number }>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { from, to } = resolveAdminForumRange(params);
    let query = supabase
      .from("forum_topics")
      .select("*, board:forum_boards(title, slug)", { count: "exact" });
    const status = params.filters?.status;
    if (status && status !== "all") query = query.eq("moderation_status", status);
    const search = sanitizeForumSearch(params.search);
    if (search) query = query.or(`title.ilike.%${search}%,author_name.ilike.%${search}%`);
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { rows: (data ?? []) as ForumTopic[], total: count ?? 0 } };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminListForumReplies(
  params: AdminForumListParams = {}
): Promise<ForumActionResult<{ rows: ForumReply[]; total: number }>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { from, to } = resolveAdminForumRange(params);
    let query = supabase
      .from("forum_replies")
      .select("*, topic:forum_topics(title, slug, board:forum_boards(slug))", {
        count: "exact",
      });
    const status = params.filters?.status;
    if (status && status !== "all") query = query.eq("moderation_status", status);
    const search = sanitizeForumSearch(params.search);
    if (search) query = query.or(`content.ilike.%${search}%,author_name.ilike.%${search}%`);
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { rows: (data ?? []) as ForumReply[], total: count ?? 0 } };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminListForumReports(
  params: AdminForumListParams = {}
): Promise<ForumActionResult<{ rows: ForumReport[]; total: number }>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { from, to } = resolveAdminForumRange(params);
    let query = supabase.from("forum_reports").select("*", { count: "exact" });
    const status = params.filters?.status;
    if (status && status !== "all") query = query.eq("status", status);
    const search = sanitizeForumSearch(params.search);
    if (search) query = query.ilike("reporter_email", `%${search}%`);
    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { rows: (data ?? []) as ForumReport[], total: count ?? 0 } };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminModerateForumTopic(
  id: string,
  moderation_status: ForumModerationStatus,
  moderator_notes?: string
): Promise<ForumActionResult<ForumTopic>> {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_topics")
      .update({
        moderation_status,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        moderator_notes: moderator_notes ?? null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/forum");
    revalidatePath("/admin/forum");
    return { ok: true, data: data as ForumTopic };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminModerateForumReply(
  id: string,
  moderation_status: ForumModerationStatus,
  moderator_notes?: string
): Promise<ForumActionResult<ForumReply>> {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_replies")
      .update({
        moderation_status,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        moderator_notes: moderator_notes ?? null,
        updated_at: new Date().toISOString(),
        hidden_at: moderation_status === "hidden" ? new Date().toISOString() : null,
      } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/forum");
    revalidatePath("/admin/forum");
    return { ok: true, data: data as ForumReply };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminUpdateForumTopicFlags(
  id: string,
  flags: { pinned?: boolean; locked?: boolean; solved?: boolean }
): Promise<ForumActionResult<ForumTopic>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_topics")
      .update({ ...flags, updated_at: new Date().toISOString() } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/forum");
    revalidatePath("/admin/forum");
    return { ok: true, data: data as ForumTopic };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminResolveForumReport(
  id: string,
  status: Extract<ForumReportStatus, "resolved" | "dismissed" | "reviewing">,
  moderator_notes?: string
): Promise<ForumActionResult<ForumReport>> {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("forum_reports")
      .update({
        status,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        moderator_notes: moderator_notes ?? null,
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id)
      .select("*")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/forum");
    return { ok: true, data: data as ForumReport };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminDeleteForumTopic(
  id: string
): Promise<ForumActionResult<null>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("forum_topics").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/forum");
    revalidatePath("/admin/forum");
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminDeleteForumReply(
  id: string
): Promise<ForumActionResult<null>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { error } = await supabase.from("forum_replies").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/forum");
    revalidatePath("/admin/forum");
    return { ok: true, data: null };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminUpsertForumBoard(
  payload: Partial<ForumBoard> & { title: string; slug: string }
): Promise<ForumActionResult<ForumBoard>> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const row = {
      title: payload.title,
      slug: payload.slug,
      description: payload.description ?? null,
      color: payload.color ?? "blue",
      display_order: payload.display_order ?? 0,
      is_visible: payload.is_visible ?? true,
      updated_at: new Date().toISOString(),
    };

    const query = payload.id
      ? supabase.from("forum_boards").update(row as never).eq("id", payload.id)
      : supabase.from("forum_boards").insert(row as never);

    const { data, error } = await query.select("*").single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/forum");
    revalidatePath("/admin/forum");
    return { ok: true, data: data as ForumBoard };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}

export async function adminGetForumPendingCounts(): Promise<
  ForumActionResult<{
    pending_topics: number;
    pending_replies: number;
    pending_reports: number;
  }>
> {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const [topics, replies, reports] = await Promise.all([
      supabase
        .from("forum_topics")
        .select("*", { count: "exact", head: true })
        .eq("moderation_status", "pending"),
      supabase
        .from("forum_replies")
        .select("*", { count: "exact", head: true })
        .eq("moderation_status", "pending"),
      supabase
        .from("forum_reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);
    return {
      ok: true,
      data: {
        pending_topics: topics.count ?? 0,
        pending_replies: replies.count ?? 0,
        pending_reports: reports.count ?? 0,
      },
    };
  } catch (e) {
    return { ok: false, error: toError(e) };
  }
}
