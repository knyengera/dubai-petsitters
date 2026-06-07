export type ForumModerationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "hidden"
  | "spam"
  | "trash";

export type ForumReportReason =
  | "spam"
  | "harassment"
  | "misinformation"
  | "off_topic"
  | "inappropriate"
  | "other";

export type ForumReportStatus = "pending" | "reviewing" | "resolved" | "dismissed";

export type ForumBoard = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parent_id: string | null;
  display_order: number;
  is_visible: boolean;
  topic_count: number;
  post_count: number;
  created_at: string;
  updated_at: string;
};

export type ForumTopic = {
  id: string;
  board_id: string;
  legacy_thread_id: string | null;
  title: string;
  slug: string;
  content: string;
  author_id: string | null;
  author_name: string;
  author_email: string;
  author_avatar_url: string | null;
  moderation_status: ForumModerationStatus;
  locked: boolean;
  pinned: boolean;
  solved: boolean;
  view_count: number;
  reply_count: number;
  reaction_count: number;
  last_reply_at: string | null;
  last_reply_author_name: string | null;
  last_reply_author_email: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  moderator_notes: string | null;
  created_at: string;
  updated_at: string;
  board?: ForumBoard;
};

export type ForumReply = {
  id: string;
  topic_id: string;
  parent_id: string | null;
  legacy_comment_id: string | null;
  content: string;
  author_id: string | null;
  author_name: string;
  author_email: string;
  author_avatar_url: string | null;
  moderation_status: ForumModerationStatus;
  reaction_count: number;
  is_accepted_answer: boolean;
  edited_at: string | null;
  hidden_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  moderator_notes: string | null;
  created_at: string;
  updated_at: string;
  children?: ForumReply[];
};

export type ForumReport = {
  id: string;
  target_type: "topic" | "reply";
  target_id: string;
  reporter_id: string | null;
  reporter_email: string;
  reason: ForumReportReason;
  details: string | null;
  status: ForumReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  moderator_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ForumStats = {
  registered_users: number;
  boards: number;
  topics: number;
  replies: number;
};

export const MODERATION_STATUS_LABELS: Record<ForumModerationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  hidden: "Hidden",
  spam: "Spam",
  trash: "Trash",
};

export const REPORT_REASON_LABELS: Record<ForumReportReason, string> = {
  spam: "Spam",
  harassment: "Harassment",
  misinformation: "Misinformation",
  off_topic: "Off topic",
  inappropriate: "Inappropriate",
  other: "Other",
};

export const REPORT_STATUS_LABELS: Record<ForumReportStatus, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  resolved: "Resolved",
  dismissed: "Dismissed",
};
