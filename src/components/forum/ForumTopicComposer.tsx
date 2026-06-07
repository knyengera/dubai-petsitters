"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { submitForumTopic } from "@/lib/forum/actions";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";
import type { ForumBoard } from "@/lib/forum/types";
import { useToast } from "@/components/ui/use-toast";

type ForumTopicComposerProps = {
  open: boolean;
  onClose: () => void;
  boards: ForumBoard[];
  defaultBoardId?: string;
  onCreated?: () => void;
};

export default function ForumTopicComposer({
  open,
  onClose,
  boards,
  defaultBoardId,
  onCreated,
}: ForumTopicComposerProps) {
  const { toast } = useToast();
  const { s, getBoardTitle } = useForumI18n();
  const [boardId, setBoardId] = useState(defaultBoardId ?? boards[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !boardId) return;
    setLoading(true);
    const result = await submitForumTopic({
      board_id: boardId,
      title,
      content,
    });
    setLoading(false);
    if (result.ok === false) {
      toast({ title: s.couldNotCreateTopic, description: result.error, variant: "destructive" });
      return;
    }
    toast({
      title: s.topicSubmitted,
      description: s.topicPendingDesc,
    });
    setTitle("");
    setContent("");
    onCreated?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">{s.startNewTopic}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label className="mb-1.5 block">{s.board}</Label>
            <Select value={boardId} onValueChange={setBoardId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={s.chooseBoard} />
              </SelectTrigger>
              <SelectContent>
                {boards.map((board) => (
                  <SelectItem key={board.id} value={board.id}>
                    {getBoardTitle(board.slug, board.title)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">{s.title}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={s.topicTitlePlaceholder}
              className="rounded-xl"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">{s.content}</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={s.topicContentPlaceholder}
              rows={6}
              className="rounded-xl resize-none"
            />
          </div>
          <p className="text-xs text-muted-foreground">{s.topicModerationNote}</p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
              {s.cancel}
            </Button>
            <Button
              className="flex-1 rounded-xl"
              onClick={handleSubmit}
              disabled={loading || !title.trim() || !content.trim()}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : s.submitTopic}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
