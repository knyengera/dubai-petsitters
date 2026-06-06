"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Loader2, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import BlogPostEditorForm from "@/components/blog/BlogPostEditorForm";
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
import {
  EMPTY_BLOG_POST_FORM,
  normalizePostPayload,
  postToFormValues,
} from "@/lib/blog/utils";
import { useToast } from "@/components/ui/use-toast";

const STATUS_BADGE: Record<string, string> = {
  draft: "secondary",
  scheduled: "outline",
  published: "default",
  trash: "destructive",
};

export default function AdminBlog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    data: posts = [],
    isLoading,
    updateRow,
    createRow,
  } = useAdminList(ADMIN_TABLES.blog_posts, "admin-blog");

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["admin-blog-comments"],
    queryFn: async () => {
      const result = await adminListBlogComments();
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [commentFilter, setCommentFilter] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(EMPTY_BLOG_POST_FORM);
  const [saving, setSaving] = useState(false);

  const filteredPosts = useMemo(() => {
    let result = [...posts];
    if (statusFilter !== "all") {
      result = result.filter((row) => String(row.status ?? "draft") === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (row) =>
          String(row.title ?? "").toLowerCase().includes(q) ||
          String(row.slug ?? "").toLowerCase().includes(q) ||
          String(row.author_name ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, search, statusFilter]);

  const filteredComments = useMemo(() => {
    if (commentFilter === "all") return comments;
    return comments.filter((c) => c.status === commentFilter);
  }, [comments, commentFilter]);

  const openCreate = () => {
    setEditingPost(null);
    setForm(EMPTY_BLOG_POST_FORM);
    setEditorOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    const post = row as BlogPost;
    setEditingPost(post);
    setForm(postToFormValues(post));
    setEditorOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content || form.content === "<p></p>") {
      toast({
        title: "Content required",
        description: "Please add article content before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const payload = normalizePostPayload(form);

    if (editingPost) {
      if (editingPost.status === "published" && payload.status === "published") {
        payload.published_at = editingPost.published_at;
      }
      const ok = await updateRow(String(editingPost.id), payload, "Post updated");
      if (ok) {
        setEditorOpen(false);
        setEditingPost(null);
        setForm(EMPTY_BLOG_POST_FORM);
      }
    } else {
      const created = await createRow(payload, "Post created");
      if (created) {
        setEditorOpen(false);
        setForm(EMPTY_BLOG_POST_FORM);
      }
    }
    setSaving(false);
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
            {comments.filter((c) => c.status === "pending").length > 0 && (
              <Badge className="text-[10px] h-5 px-1.5">
                {comments.filter((c) => c.status === "pending").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search posts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(BLOG_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AdminDataList
            rows={filteredPosts}
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
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          <Select value={commentFilter} onValueChange={setCommentFilter}>
            <SelectTrigger className="w-full sm:w-48 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All comments</SelectItem>
              {Object.entries(BLOG_COMMENT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {commentsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
              No comments found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredComments.map((comment) => {
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
        </TabsContent>
      </Tabs>

      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-4xl overflow-y-auto p-6"
        >
          <SheetHeader className="mb-6">
            <SheetTitle>
              {editingPost ? "Edit Post" : "New Post"}
            </SheetTitle>
          </SheetHeader>
          <BlogPostEditorForm
            form={form}
            onChange={setForm}
            onSubmit={handleSave}
            saving={saving}
            submitLabel={editingPost ? "Update Post" : "Create Post"}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
