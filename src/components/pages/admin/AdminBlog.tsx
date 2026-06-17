"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  useAdminPaginatedList,
  useAdminPaginatedQuery,
} from "@/components/admin/useAdminPaginatedList";
import { getAdminListConfig } from "@/lib/admin/list-config";
import { ADMIN_TABLES } from "@/lib/admin/tables";
import {
  adminDeleteBlogComment,
  adminListBlogComments,
  adminModerateBlogComment,
} from "@/lib/blog/actions";
import {
  BLOG_COMMENT_STATUS_LABELS,
  BLOG_STATUS_LABELS,
  type BlogComment,
  type BlogPost,
} from "@/lib/blog/types";
import { useToast } from "@/components/ui/use-toast";

const STATUS_BADGE: Record<string, string> = {
  draft: "secondary",
  scheduled: "outline",
  published: "default",
  trash: "destructive",
};

const POSTS_CONFIG = getAdminListConfig(ADMIN_TABLES.blog_posts);

export default function AdminBlog() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    rows: posts,
    total: postsTotal,
    page: postsPage,
    pageSize: postsPageSize,
    setPage: setPostsPage,
    search,
    setSearch,
    filters: postFilters,
    setFilter: setPostFilter,
    isLoading,
    updateRow,
  } = useAdminPaginatedList(ADMIN_TABLES.blog_posts, "admin-blog");

  const {
    rows: comments,
    total: commentsTotal,
    page: commentsPage,
    pageSize: commentsPageSize,
    setPage: setCommentsPage,
    filters: commentFilters,
    setFilter: setCommentFilter,
    isLoading: commentsLoading,
  } = useAdminPaginatedQuery<BlogComment>(
    ["admin-blog-comments"],
    async ({ page, pageSize, filters }) => {
      const result = await adminListBlogComments({ page, pageSize, filters });
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    }
  );

  const openCreate = () => {
    router.push("/admin/blog/new");
  };

  const openEdit = (row: Record<string, unknown>) => {
    router.push(`/admin/blog/${row.id}/edit`);
  };

  const handleQuickStatus = async (row: Record<string, unknown>, status: string) => {
    const post = row as BlogPost;
    const patch: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === "published") {
      patch.published = true;
      patch.published_at = post.published_at ?? new Date().toISOString();
    } else {
      patch.published = false;
    }
    await updateRow(String(row.id), patch, `Status set to ${status}`);
  };

  const moderateComment = async (comment: BlogComment, status: BlogComment["status"]) => {
    const result = await adminModerateBlogComment(comment.id, status);
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-blog-comments"] });
    toast({ title: `Comment marked as ${status}` });
  };

  const removeComment = async (comment: BlogComment) => {
    if (!confirm("Delete this comment permanently?")) return;
    const result = await adminDeleteBlogComment(comment.id);
    if (result.ok === false) {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-blog-comments"] });
    toast({ title: "Comment deleted" });
  };

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Blog"
        description="WordPress-style articles, scheduling, SEO, and comment moderation."
        actions={
          <Button onClick={openCreate} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> New Post
          </Button>
        }
      />

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="posts" className="rounded-lg">
            Posts
          </TabsTrigger>
          <TabsTrigger value="comments" className="rounded-lg gap-2">
            <MessageSquare className="w-3.5 h-3.5" />
            Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <AdminFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by title, slug, or author..."
            filters={(POSTS_CONFIG.filters ?? []).map((f) => ({
              key: f.key,
              value: postFilters[f.key] ?? "all",
              options: f.options,
              allLabel: "All statuses",
            }))}
            onFilterChange={setPostFilter}
            total={postsTotal}
            page={postsPage}
            pageSize={postsPageSize}
            resultNoun="posts"
          />

          <AdminDataList
            rows={posts}
            isLoading={isLoading}
            emptyMessage="No blog posts yet. Create your first article."
            onEdit={openEdit}
            columns={[
              {
                key: "title",
                label: "Title",
                render: (row) => (
                  <div className="space-y-1">
                    <p className="font-medium truncate">{String(row.title)}</p>
                    {row.featured ? (
                      <Badge variant="outline" className="text-[10px] gap-1">
                        <Star className="w-3 h-3 fill-current" /> Featured
                      </Badge>
                    ) : null}
                  </div>
                ),
              },
              { key: "slug", label: "Slug" },
              { key: "category", label: "Category", className: "capitalize" },
              {
                key: "status",
                label: "Status",
                render: (row) => {
                  const status = String(row.status ?? (row.published ? "published" : "draft"));
                  return (
                    <Badge variant={STATUS_BADGE[status] as "default" | "secondary" | "outline" | "destructive"} className="text-[10px] capitalize">
                      {BLOG_STATUS_LABELS[status as keyof typeof BLOG_STATUS_LABELS] ?? status}
                    </Badge>
                  );
                },
              },
              {
                key: "published_at",
                label: "Publish date",
                render: (row) => {
                  const date = row.published_at ?? row.scheduled_at ?? row.created_at;
                  return date
                    ? format(new Date(String(date)), "MMM d, yyyy")
                    : "—";
                },
              },
            ]}
            rowActions={(row) => (
              <Select
                value={String(row.status ?? (row.published ? "published" : "draft"))}
                onValueChange={(v) => handleQuickStatus(row, v)}
              >
                <SelectTrigger className="w-32 h-8 rounded-lg text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BLOG_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            onDelete={(row) => {
              if (!confirm(`Move "${row.title}" to trash?`)) return;
              void handleQuickStatus(row, "trash");
            }}
          />

          <AdminPagination
            page={postsPage}
            total={postsTotal}
            pageSize={postsPageSize}
            onPageChange={setPostsPage}
          />
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <AdminFilterBar
            filters={[
              {
                key: "status",
                value: commentFilters.status ?? "all",
                options: Object.entries(BLOG_COMMENT_STATUS_LABELS).map(
                  ([value, label]) => ({ value, label })
                ),
                allLabel: "All comments",
              },
            ]}
            onFilterChange={setCommentFilter}
            total={commentsTotal}
            page={commentsPage}
            pageSize={commentsPageSize}
            resultNoun="comments"
          />

          {commentsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
              No comments found.
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => {
                const post = posts.find((p) => String(p.id) === comment.post_id);
                return (
                  <div
                    key={comment.id}
                    className="bg-card border border-border rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{comment.author_name}</span>
                      <span className="text-muted-foreground">{comment.author_email}</span>
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        {BLOG_COMMENT_STATUS_LABELS[comment.status]}
                      </Badge>
                      {post ? (
                        <span className="text-muted-foreground">
                          on <em>{String(post.title)}</em>
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {comment.content}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {comment.status !== "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => moderateComment(comment, "approved")}
                        >
                          Approve
                        </Button>
                      )}
                      {comment.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => moderateComment(comment, "pending")}
                        >
                          Unapprove
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => moderateComment(comment, "spam")}
                      >
                        Spam
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-destructive"
                        onClick={() => removeComment(comment)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <AdminPagination
            page={commentsPage}
            total={commentsTotal}
            pageSize={commentsPageSize}
            onPageChange={setCommentsPage}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
