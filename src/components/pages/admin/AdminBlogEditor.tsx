"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import BlogPostEditorForm from "@/components/blog/BlogPostEditorForm";
import { adminCreate, adminGet, adminUpdate } from "@/lib/admin/actions";
import { ADMIN_TABLES } from "@/lib/admin/tables";
import type { BlogPost } from "@/lib/blog/types";
import {
  EMPTY_BLOG_POST_FORM,
  normalizePostPayload,
  postToFormValues,
} from "@/lib/blog/utils";
import { useToast } from "@/components/ui/use-toast";

type AdminBlogEditorProps = {
  postId?: string;
};

export default function AdminBlogEditor({ postId }: AdminBlogEditorProps) {
  const isEditing = Boolean(postId);

  const { data: post, isLoading } = useQuery({
    queryKey: ["admin-blog-post", postId],
    enabled: isEditing,
    queryFn: async () => {
      const result = await adminGet(ADMIN_TABLES.blog_posts, String(postId));
      if (result.ok === false) throw new Error(result.error);
      return result.data as BlogPost | null;
    },
  });

  if (isEditing && isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEditing && !post) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Blog post not found.
      </div>
    );
  }

  return <AdminBlogEditorContent post={post ?? undefined} />;
}

function AdminBlogEditorContent({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = Boolean(post);
  const [form, setForm] = useState(() =>
    post ? postToFormValues(post) : EMPTY_BLOG_POST_FORM
  );
  const [saving, setSaving] = useState(false);

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

    const result =
      post
        ? await adminUpdate(
            ADMIN_TABLES.blog_posts,
            post.id,
            {
              ...payload,
              published_at:
                post.status === "published" && payload.status === "published"
                  ? post.published_at
                  : payload.published_at,
            },
            ["/admin/blog", `/admin/blog/${post.id}/edit`]
          )
        : await adminCreate(ADMIN_TABLES.blog_posts, payload, ["/admin/blog"]);

    setSaving(false);

    if (result.ok === false) {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
      return;
    }

    toast({ title: isEditing ? "Post updated" : "Post created" });
    router.push("/admin/blog");
  };

  return (
    <div className="pb-10">
      <AdminPageHeader
        title={isEditing ? "Edit Blog Post" : "New Blog Post"}
        description="Detailed blog editor for content, scheduling, SEO, and cover media."
        actions={
          <Link href="/admin/blog">
            <Button variant="outline" className="rounded-xl gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>
        }
      />

      <div className="bg-card border border-border rounded-2xl p-5">
        <BlogPostEditorForm
          form={form}
          onChange={setForm}
          onSubmit={handleSave}
          saving={saving}
          submitLabel={isEditing ? "Update Post" : "Create Post"}
        />
      </div>
    </div>
  );
}
