"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitForumReply } from "@/lib/forum/actions";
import { useAuth } from "@/lib/auth-context";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";
import { useToast } from "@/components/ui/use-toast";

type ForumReplyComposerProps = {
  topicId: string;
  parentId?: string | null;
  placeholder?: string;
  onPosted?: () => void;
  onCancel?: () => void;
  compact?: boolean;
};

export default function ForumReplyComposer({
  topicId,
  parentId,
  placeholder,
  onPosted,
  onCancel,
  compact,
}: ForumReplyComposerProps) {
  const { user, navigateToLogin } = useAuth();
  const { toast } = useToast();
  const { s } = useForumI18n();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      navigateToLogin();
      return;
    }
    if (!content.trim()) return;
    setLoading(true);
    const result = await submitForumReply({
      topic_id: topicId,
      content,
      parent_id: parentId,
    });
    setLoading(false);
    if (result.ok === false) {
      toast({ title: s.replyFailed, description: result.error, variant: "destructive" });
      return;
    }
    toast({
      title: s.replySubmitted,
      description: s.replyPendingDesc,
    });
    setContent("");
    onPosted?.();
  };

  if (!user) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground text-sm mb-3">{s.signInDiscussion}</p>
        <Button onClick={navigateToLogin} className="rounded-xl">
          {s.signIn}
        </Button>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-3" : "bg-card border border-border rounded-2xl p-5"}>
      {!compact && <h3 className="font-semibold text-sm mb-3">{s.leaveReply}</h3>}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder ?? s.replyPlaceholder}
        rows={compact ? 3 : 4}
        className="rounded-xl resize-none"
      />
      <div className="flex justify-end gap-2 mt-3">
        {onCancel && (
          <Button variant="outline" className="rounded-xl" onClick={onCancel}>
            {s.cancel}
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="rounded-xl gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {s.postReply}
        </Button>
      </div>
    </div>
  );
}
