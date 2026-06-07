"use client";

import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitBlogComment } from "@/lib/blog/actions";
import { useBlogI18n } from "@/lib/i18n/use-blog-i18n";
import { useToast } from "@/components/ui/use-toast";

type BlogCommentFormProps = {
  postId: string;
  onSubmitted?: () => void;
};

export default function BlogCommentForm({ postId, onSubmitted }: BlogCommentFormProps) {
  const { toast } = useToast();
  const { s } = useBlogI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const result = await submitBlogComment({
      post_id: postId,
      author_name: name,
      author_email: email,
      content,
    });
    setSubmitting(false);

    if (result.ok === false) {
      toast({
        title: s.commentFailed,
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setContent("");
    toast({
      title: s.commentSubmitted,
      description: s.commentPendingDesc,
    });
    onSubmitted?.();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border p-5 space-y-4 bg-card">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">{s.leaveComment}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>{s.name} *</Label>
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label>{s.email} *</Label>
          <Input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl mt-1"
          />
        </div>
      </div>
      <div>
        <Label>{s.comment} *</Label>
        <Textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="rounded-xl mt-1 min-h-[100px]"
          placeholder={s.commentPlaceholder}
        />
      </div>
      <p className="text-xs text-muted-foreground">{s.commentModerationNote}</p>
      <Button type="submit" disabled={submitting} className="rounded-xl">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : s.postComment}
      </Button>
    </form>
  );
}
