"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Check,
  Lock,
  Pin,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES } from "@/lib/admin/tables";
import {
  adminDeleteForumReply,
  adminDeleteForumTopic,
  adminGetForumPendingCounts,
  adminListForumReplies,
  adminListForumReports,
  adminListForumTopics,
  adminModerateForumReply,
  adminModerateForumTopic,
  adminResolveForumReport,
  adminUpdateForumTopicFlags,
  adminUpsertForumBoard,
} from "@/lib/forum/actions";
import {
  MODERATION_STATUS_LABELS,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  type ForumModerationStatus,
  type ForumReply,
  type ForumReport,
  type ForumTopic,
} from "@/lib/forum/types";
import { useToast } from "@/components/ui/use-toast";

const STATUS_BADGE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
  hidden: "secondary",
  spam: "destructive",
  trash: "destructive",
};

export default function AdminForum() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [replyFilter, setReplyFilter] = useState<string>("all");
  const [reportFilter, setReportFilter] = useState<string>("all");
  const [boardForm, setBoardForm] = useState({
    title: "",
    slug: "",
    description: "",
    color: "blue",
    display_order: 0,
  });

  const { data: boards = [], isLoading: boardsLoading, updateRow } =
    useAdminList(ADMIN_TABLES.forum_boards, "admin-forum-boards", "display_order");

  const { data: pendingCounts } = useQuery({
    queryKey: ["admin-forum-pending"],
    queryFn: async () => {
      const result = await adminGetForumPendingCounts();
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: topics = [], isLoading: topicsLoading } = useQuery({
    queryKey: ["admin-forum-topics", topicFilter],
    queryFn: async () => {
      const result = await adminListForumTopics(
        topicFilter === "all" ? undefined : (topicFilter as ForumModerationStatus)
      );
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ["admin-forum-replies", replyFilter],
    queryFn: async () => {
      const result = await adminListForumReplies(
        replyFilter === "all" ? undefined : (replyFilter as ForumModerationStatus)
      );
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["admin-forum-reports", reportFilter],
    queryFn: async () => {
      const result = await adminListForumReports(
        reportFilter === "all" ? undefined : (reportFilter as ForumReport["status"])
      );
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-forum-topics"] });
    queryClient.invalidateQueries({ queryKey: ["admin-forum-replies"] });
    queryClient.invalidateQueries({ queryKey: ["admin-forum-reports"] });
    queryClient.invalidateQueries({ queryKey: ["admin-forum-pending"] });
    queryClient.invalidateQueries({ queryKey: ["admin-forum-boards"] });
  };

  const moderateTopic = async (topic: ForumTopic, status: ForumModerationStatus) => {
    const result = await adminModerateForumTopic(topic.id, status);
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: `Topic marked as ${status}` });
    invalidate();
  };

  const moderateReply = async (reply: ForumReply, status: ForumModerationStatus) => {
    const result = await adminModerateForumReply(reply.id, status);
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: `Reply marked as ${status}` });
    invalidate();
  };

  const resolveReport = async (
    report: ForumReport,
    status: "resolved" | "dismissed" | "reviewing"
  ) => {
    const result = await adminResolveForumReport(report.id, status);
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: `Report ${status}` });
    invalidate();
  };

  const togglePin = async (topic: ForumTopic) => {
    const result = await adminUpdateForumTopicFlags(topic.id, { pinned: !topic.pinned });
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    invalidate();
  };

  const toggleLock = async (topic: ForumTopic) => {
    const result = await adminUpdateForumTopicFlags(topic.id, { locked: !topic.locked });
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    invalidate();
  };

  const removeTopic = async (topic: ForumTopic) => {
    if (!confirm(`Delete topic "${topic.title}"?`)) return;
    const result = await adminDeleteForumTopic(topic.id);
    if (result.ok === false) {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" });
      return;
    }
    invalidate();
  };

  const removeReply = async (reply: ForumReply) => {
    if (!confirm("Delete this reply permanently?")) return;
    const result = await adminDeleteForumReply(reply.id);
    if (result.ok === false) {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" });
      return;
    }
    invalidate();
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await adminUpsertForumBoard(boardForm);
    if (result.ok === false) {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Board saved" });
    setBoardForm({ title: "", slug: "", description: "", color: "blue", display_order: 0 });
    invalidate();
  };

  const pendingBadge = useMemo(() => {
    const total =
      (pendingCounts?.pending_topics ?? 0) +
      (pendingCounts?.pending_replies ?? 0) +
      (pendingCounts?.pending_reports ?? 0);
    return total;
  }, [pendingCounts]);

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Forum"
        description="Moderate topics, replies, reports, and boards."
        actions={
          pendingBadge > 0 ? (
            <Badge variant="destructive" className="rounded-full px-3">
              {pendingBadge} pending
            </Badge>
          ) : null
        }
      />

      <Tabs defaultValue="topics" className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <TabsList className="rounded-xl flex flex-wrap h-auto w-full lg:flex-1">
            <TabsTrigger value="topics" className="rounded-lg flex-1">
              Topics
              {(pendingCounts?.pending_topics ?? 0) > 0 && (
                <Badge className="ml-2 text-[10px]" variant="secondary">
                  {pendingCounts?.pending_topics}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="replies" className="rounded-lg flex-1">
              Replies
              {(pendingCounts?.pending_replies ?? 0) > 0 && (
                <Badge className="ml-2 text-[10px]" variant="secondary">
                  {pendingCounts?.pending_replies}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-lg flex-1">
              Reports
              {(pendingCounts?.pending_reports ?? 0) > 0 && (
                <Badge className="ml-2 text-[10px]" variant="secondary">
                  {pendingCounts?.pending_reports}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="boards" className="rounded-lg flex-1">
              Boards
            </TabsTrigger>
          </TabsList>
          <div className="w-full lg:w-56">
            <TabsContent value="topics" className="m-0">
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(MODERATION_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
            <TabsContent value="replies" className="m-0">
              <Select value={replyFilter} onValueChange={setReplyFilter}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(MODERATION_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
            <TabsContent value="reports" className="m-0">
              <Select value={reportFilter} onValueChange={setReportFilter}>
                <SelectTrigger className="w-full rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
          </div>
        </div>

        <TabsContent value="topics" className="space-y-4">
          <AdminDataList
            rows={topics as unknown as Record<string, unknown>[]}
            isLoading={topicsLoading}
            onEdit={(row) => router.push(`/admin/forum/topics/${row.id}/edit`)}
            columns={[
              { key: "title", label: "Title" },
              { key: "author_name", label: "Author" },
              {
                key: "moderation_status",
                label: "Status",
                render: (row) => (
                  <Badge variant={STATUS_BADGE[String(row.moderation_status)] ?? "outline"}>
                    {MODERATION_STATUS_LABELS[row.moderation_status as ForumModerationStatus] ??
                      String(row.moderation_status)}
                  </Badge>
                ),
              },
              {
                key: "created_at",
                label: "Created",
                render: (row) =>
                  row.created_at
                    ? format(new Date(String(row.created_at)), "MMM d, yyyy")
                    : "—",
              },
            ]}
            rowActions={(row) => {
              const topic = row as unknown as ForumTopic;
              return (
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg gap-1"
                    onClick={() => moderateTopic(topic, "approved")}
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg gap-1"
                    onClick={() => moderateTopic(topic, "spam")}
                  >
                    Spam
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg gap-1"
                    onClick={() => togglePin(topic)}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    {topic.pinned ? "Unpin" : "Pin"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg gap-1"
                    onClick={() => toggleLock(topic)}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    {topic.locked ? "Unlock" : "Lock"}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-lg gap-1"
                    onClick={() => removeTopic(topic)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            }}
          />
        </TabsContent>

        <TabsContent value="replies" className="space-y-4">
          <AdminDataList
            rows={replies as unknown as Record<string, unknown>[]}
            isLoading={repliesLoading}
            onEdit={(row) => router.push(`/admin/forum/replies/${row.id}/edit`)}
            columns={[
              {
                key: "content",
                label: "Reply",
                render: (row) => (
                  <span className="line-clamp-2 max-w-md">{String(row.content ?? "")}</span>
                ),
              },
              { key: "author_name", label: "Author" },
              {
                key: "moderation_status",
                label: "Status",
                render: (row) => (
                  <Badge variant={STATUS_BADGE[String(row.moderation_status)] ?? "outline"}>
                    {MODERATION_STATUS_LABELS[row.moderation_status as ForumModerationStatus] ??
                      String(row.moderation_status)}
                  </Badge>
                ),
              },
            ]}
            rowActions={(row) => {
              const reply = row as unknown as ForumReply;
              return (
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg gap-1"
                    onClick={() => moderateReply(reply, "approved")}
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => moderateReply(reply, "hidden")}
                  >
                    Hide
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => moderateReply(reply, "spam")}
                  >
                    Spam
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-lg"
                    onClick={() => removeReply(reply)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            }}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <AdminDataList
            rows={reports as unknown as Record<string, unknown>[]}
            isLoading={reportsLoading}
            onEdit={(row) => router.push(`/admin/forum/reports/${row.id}/edit`)}
            columns={[
              {
                key: "target_type",
                label: "Target",
                render: (row) => `${row.target_type} · ${String(row.target_id).slice(0, 8)}…`,
              },
              {
                key: "reason",
                label: "Reason",
                render: (row) =>
                  REPORT_REASON_LABELS[row.reason as ForumReport["reason"]] ??
                  String(row.reason),
              },
              { key: "reporter_email", label: "Reporter" },
              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <Badge variant="outline">
                    {REPORT_STATUS_LABELS[row.status as ForumReport["status"]] ??
                      String(row.status)}
                  </Badge>
                ),
              },
            ]}
            rowActions={(row) => {
              const report = row as unknown as ForumReport;
              return (
                <div className="flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={() => resolveReport(report, "reviewing")}
                  >
                    Review
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg gap-1"
                    onClick={() => resolveReport(report, "resolved")}
                  >
                    <Check className="w-3.5 h-3.5" /> Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg gap-1"
                    onClick={() => resolveReport(report, "dismissed")}
                  >
                    <X className="w-3.5 h-3.5" /> Dismiss
                  </Button>
                </div>
              );
            }}
          />
        </TabsContent>

        <TabsContent value="boards" className="space-y-6">
          <form
            onSubmit={handleCreateBoard}
            className="bg-card border border-border rounded-2xl p-5 space-y-4 max-w-xl"
          >
            <h3 className="font-heading font-semibold">Add board</h3>
            <div>
              <Label className="mb-1.5 block">Title</Label>
              <Input
                value={boardForm.title}
                onChange={(e) => setBoardForm((f) => ({ ...f, title: e.target.value }))}
                className="rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Slug</Label>
              <Input
                value={boardForm.slug}
                onChange={(e) => setBoardForm((f) => ({ ...f, slug: e.target.value }))}
                className="rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="mb-1.5 block">Description</Label>
              <Textarea
                value={boardForm.description}
                onChange={(e) =>
                  setBoardForm((f) => ({ ...f, description: e.target.value }))
                }
                className="rounded-xl resize-none"
                rows={3}
              />
            </div>
            <Button type="submit" className="rounded-xl">
              Save board
            </Button>
          </form>

          <AdminDataList
            rows={boards}
            isLoading={boardsLoading}
            onEdit={(row) => router.push(`/admin/forum/boards/${row.id}/edit`)}
            columns={[
              { key: "title", label: "Title" },
              { key: "slug", label: "Slug" },
              { key: "topic_count", label: "Topics" },
              { key: "post_count", label: "Posts" },
              {
                key: "is_visible",
                label: "Visible",
                render: (row) => (row.is_visible ? "Yes" : "No"),
              },
            ]}
            rowActions={(row) => (
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg"
                onClick={() =>
                  updateRow(String(row.id), { is_visible: !row.is_visible }, "Visibility updated")
                }
              >
                Toggle visibility
              </Button>
            )}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
