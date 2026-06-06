"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES } from "@/lib/admin/tables";

const EMPTY = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "pet_care",
  author_name: "Saudi Petsitters",
  published: false,
};

export default function AdminBlog() {
  const { data: posts = [], isLoading, updateRow, deleteRow, createRow } = useAdminList(
    ADMIN_TABLES.blog_posts,
    "admin-blog"
  );
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const slug =
      form.slug ||
      form.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const created = await createRow({ ...form, slug }, "Post created");
    if (created) {
      setForm(EMPTY);
      setShowForm(false);
    }
    setSaving(false);
  };

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Blog"
        description="Create and publish blog articles."
        actions={
          <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> New Post
          </Button>
        }
      />
      <AdminDataList
        rows={posts}
        isLoading={isLoading}
        columns={[
          { key: "title", label: "Title" },
          { key: "category", label: "Category" },
          { key: "author_name", label: "Author" },
          {
            key: "published",
            label: "Published",
            render: (row) =>
              row.published ? (
                <Badge className="text-[10px] bg-emerald-500 text-white">Live</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">Draft</Badge>
              ),
          },
        ]}
        rowActions={(row) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl"
            onClick={() =>
              updateRow(
                String(row.id),
                { published: !row.published },
                row.published ? "Unpublished" : "Published"
              )
            }
          >
            {row.published ? "Unpublish" : "Publish"}
          </Button>
        )}
        onDelete={(row) => deleteRow(String(row.id), `Delete "${row.title}"?`)}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Blog Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Excerpt</Label>
              <Input value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Content *</Label>
              <Textarea required value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} className="rounded-xl mt-1 min-h-[120px]" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))} />
              Publish immediately
            </label>
            <Button type="submit" disabled={saving} className="w-full rounded-xl">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Post"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
