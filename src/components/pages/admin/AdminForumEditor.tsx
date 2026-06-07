"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { adminGet, adminUpdate } from "@/lib/admin/actions";
import { ADMIN_TABLES, type AdminTable, type Row } from "@/lib/admin/tables";
import {
  MODERATION_STATUS_LABELS,
  REPORT_STATUS_LABELS,
  type ForumModerationStatus,
  type ForumReportStatus,
} from "@/lib/forum/types";
import { useToast } from "@/components/ui/use-toast";

type ForumRecordType = "topics" | "replies" | "reports" | "boards";

type FieldConfig = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select" | "checkbox" | "integer";
  options?: string[];
  required?: boolean;
  readonly?: boolean;
};

type TypeConfig = {
  title: string;
  table: AdminTable;
  titleKey: string;
  fields: FieldConfig[];
};

const MODERATION_OPTIONS = Object.keys(MODERATION_STATUS_LABELS) as ForumModerationStatus[];
const REPORT_STATUS_OPTIONS = Object.keys(REPORT_STATUS_LABELS) as ForumReportStatus[];

const CONFIG: Record<ForumRecordType, TypeConfig> = {
  topics: {
    title: "Forum Topic",
    table: ADMIN_TABLES.forum_topics,
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "content", label: "Content", type: "textarea", required: true },
      { key: "moderation_status", label: "Moderation Status", type: "select", options: MODERATION_OPTIONS },
      { key: "moderator_notes", label: "Moderator Notes", type: "textarea" },
      { key: "pinned", label: "Pinned", type: "checkbox" },
      { key: "locked", label: "Locked", type: "checkbox" },
      { key: "solved", label: "Solved", type: "checkbox" },
      { key: "author_name", label: "Author", readonly: true },
      { key: "author_email", label: "Author Email", readonly: true },
      { key: "created_at", label: "Created", readonly: true },
    ],
  },
  replies: {
    title: "Forum Reply",
    table: ADMIN_TABLES.forum_replies,
    titleKey: "author_name",
    fields: [
      { key: "content", label: "Reply", type: "textarea", required: true },
      { key: "moderation_status", label: "Moderation Status", type: "select", options: MODERATION_OPTIONS },
      { key: "moderator_notes", label: "Moderator Notes", type: "textarea" },
      { key: "is_accepted_answer", label: "Accepted Answer", type: "checkbox" },
      { key: "topic_id", label: "Topic ID", readonly: true },
      { key: "author_name", label: "Author", readonly: true },
      { key: "author_email", label: "Author Email", readonly: true },
      { key: "created_at", label: "Created", readonly: true },
    ],
  },
  reports: {
    title: "Forum Report",
    table: ADMIN_TABLES.forum_reports,
    titleKey: "reporter_email",
    fields: [
      { key: "status", label: "Status", type: "select", options: REPORT_STATUS_OPTIONS },
      { key: "moderator_notes", label: "Moderator Notes", type: "textarea" },
      { key: "details", label: "Reporter Details", type: "textarea" },
      { key: "target_type", label: "Target Type", readonly: true },
      { key: "target_id", label: "Target ID", readonly: true },
      { key: "reason", label: "Reason", readonly: true },
      { key: "reporter_email", label: "Reporter", readonly: true },
      { key: "created_at", label: "Created", readonly: true },
    ],
  },
  boards: {
    title: "Forum Board",
    table: ADMIN_TABLES.forum_boards,
    titleKey: "title",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "slug", label: "Slug", required: true },
      { key: "description", label: "Description", type: "textarea" },
      { key: "color", label: "Color" },
      { key: "display_order", label: "Display Order", type: "integer" },
      { key: "is_visible", label: "Visible", type: "checkbox" },
      { key: "topic_count", label: "Topics", readonly: true },
      { key: "post_count", label: "Posts", readonly: true },
    ],
  },
};

export default function AdminForumEditor({
  recordType,
  recordId,
}: {
  recordType: ForumRecordType;
  recordId: string;
}) {
  const config = CONFIG[recordType];
  const { data: record, isLoading } = useQuery({
    queryKey: ["admin-forum-editor", recordType, recordId],
    queryFn: async () => {
      const result = await adminGet(config.table, recordId);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Forum record not found.
      </div>
    );
  }

  return <AdminForumEditorContent record={record} recordType={recordType} config={config} />;
}

function AdminForumEditorContent({
  record,
  recordType,
  config,
}: {
  record: Row;
  recordType: ForumRecordType;
  config: TypeConfig;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState(() => rowToForm(record, config.fields));
  const [saving, setSaving] = useState(false);
  const editableFields = config.fields.filter((field) => !field.readonly);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await adminUpdate(
      config.table,
      String(record.id),
      formToPayload(form, editableFields),
      ["/admin/forum", `/admin/forum/${recordType}/${record.id}/edit`]
    );
    setSaving(false);

    if (result.ok === false) {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
      return;
    }

    toast({ title: `${config.title} updated` });
    router.push("/admin/forum");
  };

  return (
    <div className="pb-10">
      <AdminPageHeader
        title={`Edit ${config.title}`}
        description={String(record[config.titleKey] ?? record.id)}
        actions={
          <Link href="/admin/forum">
            <Button variant="outline" className="rounded-xl gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Forum
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            {editableFields.map((field) => (
              <EditableField
                key={field.key}
                field={field}
                value={form[field.key]}
                onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
              />
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3 self-start">
            <h3 className="font-heading font-semibold text-sm">Record Details</h3>
            {config.fields
              .filter((field) => field.readonly)
              .map((field) => (
                <div key={field.key}>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                    {field.label}
                  </p>
                  <p className="text-sm text-foreground break-words">
                    {formatValue(record[field.key])}
                  </p>
                </div>
              ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/admin/forum">
            <Button type="button" variant="outline" className="rounded-xl">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="rounded-xl min-w-[140px]">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function EditableField({
  field,
  value,
  onChange,
}: {
  field: FieldConfig;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  if (field.type === "checkbox") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border p-3">
        <Label htmlFor={field.key}>{field.label}</Label>
        <input
          id={field.key}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        <Label className="mb-1.5 block">{field.label}</Label>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="rounded-xl w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <Label className="mb-1.5 block">{field.label}</Label>
        <Textarea
          required={field.required}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl min-h-40"
        />
      </div>
    );
  }

  return (
    <div>
      <Label className="mb-1.5 block">{field.label}</Label>
      <Input
        required={field.required}
        type={field.type === "integer" ? "number" : "text"}
        step={field.type === "integer" ? "1" : undefined}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl"
      />
    </div>
  );
}

function rowToForm(row: Row, fields: FieldConfig[]) {
  return fields.reduce<Record<string, string | boolean>>((acc, field) => {
    if (field.readonly) return acc;
    const value = row[field.key];
    acc[field.key] = field.type === "checkbox" ? Boolean(value) : valueToInput(value);
    return acc;
  }, {});
}

function formToPayload(form: Record<string, string | boolean>, fields: FieldConfig[]) {
  return fields.reduce<Row>((payload, field) => {
    const value = form[field.key];
    if (field.type === "checkbox") {
      payload[field.key] = Boolean(value);
    } else if (field.type === "integer") {
      payload[field.key] = optionalInteger(String(value));
    } else {
      payload[field.key] = optionalText(String(value));
    }
    payload.updated_at = new Date().toISOString();
    return payload;
  }, {});
}

function valueToInput(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalInteger(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number.parseInt(trimmed, 10) : null;
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}
