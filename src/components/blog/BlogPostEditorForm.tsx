"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUpload from "@/components/common/ImageUpload";
import RichTextEditor from "@/components/blog/RichTextEditor";
import {
  BLOG_CATEGORIES,
  BLOG_STATUS_LABELS,
  type BlogPostFormValues,
} from "@/lib/blog/types";
import { slugify } from "@/lib/blog/utils";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { uploadAppFile } from "@/lib/storage/upload";

type BlogPostEditorFormProps = {
  form: BlogPostFormValues;
  onChange: (form: BlogPostFormValues) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving?: boolean;
  submitLabel?: string;
};

export default function BlogPostEditorForm({
  form,
  onChange,
  onSubmit,
  saving = false,
  submitLabel = "Save Post",
}: BlogPostEditorFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slugTouched, setSlugTouched] = useState(Boolean(form.slug));
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [editorImageHandler, setEditorImageHandler] = useState<
    ((url: string) => void) | null
  >(null);

  const update = (patch: Partial<BlogPostFormValues>) => {
    onChange({ ...form, ...patch });
  };

  const handleTitleChange = (title: string) => {
    const next = { ...form, title };
    if (!slugTouched) {
      next.slug = slugify(title);
    }
    onChange(next);
  };

  const handleImageUpload = async (file: File) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to upload images.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = await uploadAppFile("public-uploads", file, user.id, "blog", "inline");
      if (editorImageHandler) {
        editorImageHandler(url);
        setEditorImageHandler(null);
      } else {
        update({ cover_image: url });
      }
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Could not upload image",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <Label>Title *</Label>
            <Input
              required
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="rounded-xl mt-1"
              placeholder="Post title"
            />
          </div>

          <div>
            <Label>Slug</Label>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update({ slug: slugify(e.target.value) });
              }}
              className="rounded-xl mt-1 font-mono text-sm"
              placeholder="post-url-slug"
            />
          </div>

          <div>
            <Label>Excerpt</Label>
            <Textarea
              value={form.excerpt}
              onChange={(e) => update({ excerpt: e.target.value })}
              className="rounded-xl mt-1 min-h-[80px]"
              placeholder="Short summary for cards and SEO"
            />
          </div>

          <div>
            <Label>Content *</Label>
            <div className="mt-1">
              <RichTextEditor
                value={form.content}
                onChange={(content) => update({ content })}
                onImageRequest={(insert) => {
                  setEditorImageHandler(() => insert);
                  imageInputRef.current?.click();
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border p-4 space-y-4 bg-muted/20">
            <h3 className="text-sm font-semibold">Publish</h3>

            <div>
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(status) =>
                  update({ status: status as BlogPostFormValues["status"] })
                }
              >
                <SelectTrigger className="rounded-xl mt-1">
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
            </div>

            {form.status === "scheduled" && (
              <div>
                <Label>Schedule for</Label>
                <Input
                  type="datetime-local"
                  required
                  value={form.scheduled_at}
                  onChange={(e) => update({ scheduled_at: e.target.value })}
                  className="rounded-xl mt-1"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Featured post</Label>
              <Switch
                id="featured"
                checked={form.featured}
                onCheckedChange={(featured) => update({ featured })}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border p-4 space-y-4 bg-muted/20">
            <h3 className="text-sm font-semibold">Details</h3>

            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(category) => update({ category })}
              >
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOG_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Author</Label>
              <Input
                value={form.author_name}
                onChange={(e) => update({ author_name: e.target.value })}
                className="rounded-xl mt-1"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <Input
                value={form.tags}
                onChange={(e) => update({ tags: e.target.value })}
                className="rounded-xl mt-1"
                placeholder="summer, grooming, cats"
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Comma-separated tags
              </p>
            </div>

            <ImageUpload
              value={form.cover_image}
              onChange={(url) => update({ cover_image: url })}
              category="blog"
              label="Cover image"
              variant="wide"
              className="w-full"
            />
          </div>

          <div className="rounded-2xl border border-border p-4 space-y-4 bg-muted/20">
            <h3 className="text-sm font-semibold">SEO</h3>
            <div>
              <Label>SEO title</Label>
              <Input
                value={form.seo_title}
                onChange={(e) => update({ seo_title: e.target.value })}
                className="rounded-xl mt-1"
                placeholder={form.title || "Meta title"}
              />
            </div>
            <div>
              <Label>SEO description</Label>
              <Textarea
                value={form.seo_description}
                onChange={(e) => update({ seo_description: e.target.value })}
                className="rounded-xl mt-1 min-h-[80px]"
                placeholder={form.excerpt || "Meta description"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={saving} className="rounded-xl min-w-[140px]">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
        </Button>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImageUpload(file);
          e.target.value = "";
        }}
      />
    </form>
  );
}
