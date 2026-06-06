"use client";

import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitBlogComment } from "@/lib/blog/actions";
import { useToast } from "@/components/ui/use-toast";

type BlogCommentFormProps = {
  postId: string;
  onSubmitted?: () => void;
};

export default function BlogCommentForm({ postId, onSubmitted }: BlogCommentFormProps) {
  const { toast } = useToast();
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
        title: "Comment failed",
        description: result.error,
        variant: "destructive",
      });
      return;
    }

    setContent("");
    toast({
      title: "Comment submitted",
      description: "Your comment is pending moderation.",
    });
    onSubmitted?.();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border p-5 space-y-4 bg-card">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Leave a comment</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Name *</Label>
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-xl mt-1"
          />
        </div>
        <div>
          <Label>Email *</Label>
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
        <Label>Comment *</Label>
        <Textarea
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="rounded-xl mt-1 min-h-[100px]"
          placeholder="Share your thoughts..."
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Comments are moderated before they appear publicly.
      </p>
      <Button type="submit" disabled={submitting} className="rounded-xl">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Comment"}
      </Button>
    </form>
  );
}
