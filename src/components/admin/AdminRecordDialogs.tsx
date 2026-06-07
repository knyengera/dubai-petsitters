"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/common/ImageUpload";
import type { Row } from "@/lib/admin/tables";

export type AdminRecordField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "integer" | "select" | "checkbox" | "image" | "list" | "date";
  options?: string[];
  required?: boolean;
  viewOnly?: boolean;
  hideInView?: boolean;
  placeholder?: string;
  className?: string;
};

type AdminRecordViewDialogProps = {
  row: Row | null;
  title: string;
  fields: AdminRecordField[];
  imageKey?: string;
  titleKey?: string;
  badges?: (row: Row) => React.ReactNode;
  actions?: (row: Row) => React.ReactNode;
  onOpenChange: (open: boolean) => void;
};

type AdminRecordEditDialogProps = {
  row: Row | null;
  title: string;
  fields: AdminRecordField[];
  onSave: (id: string, payload: Row) => Promise<boolean>;
  onOpenChange: (open: boolean) => void;
};

const WIDE_DIALOG_CLASS =
  "w-[min(1120px,calc(100vw-2rem))] max-w-none sm:max-w-none rounded-2xl max-h-[90vh] overflow-y-auto";

export function AdminRecordViewDialog({
  row,
  title,
  fields,
  imageKey,
  titleKey,
  badges,
  actions,
  onOpenChange,
}: AdminRecordViewDialogProps) {
  return (
    <Dialog open={Boolean(row)} onOpenChange={onOpenChange}>
      <DialogContent className={WIDE_DIALOG_CLASS}>
        {row ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading flex flex-wrap items-center gap-2">
                {String((titleKey ? row[titleKey] : undefined) ?? title)}
                {badges?.(row)}
              </DialogTitle>
            </DialogHeader>

            {imageKey && row[imageKey] ? (
              <img
                src={String(row[imageKey])}
                alt={String((titleKey ? row[titleKey] : undefined) ?? title)}
                className="h-48 w-full rounded-2xl object-cover"
              />
            ) : null}

            {actions ? <div className="flex flex-wrap gap-2">{actions(row)}</div> : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {fields
                .filter((field) => !field.hideInView)
                .map((field) => (
                  <DetailItem key={field.key} label={field.label} value={row[field.key]} className={field.className} />
                ))}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function AdminRecordEditDialog({
  row,
  title,
  fields,
  onSave,
  onOpenChange,
}: AdminRecordEditDialogProps) {
  return (
    <Dialog open={Boolean(row)} onOpenChange={onOpenChange}>
      <DialogContent className={WIDE_DIALOG_CLASS}>
        {row ? (
          <AdminRecordEditForm
            key={String(row.id)}
            row={row}
            title={title}
            fields={fields}
            onSave={onSave}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AdminRecordEditForm({
  row,
  title,
  fields,
  onSave,
  onCancel,
}: {
  row: Row;
  title: string;
  fields: AdminRecordField[];
  onSave: (id: string, payload: Row) => Promise<boolean>;
  onCancel: () => void;
}) {
  const editableFields = fields.filter((field) => !field.viewOnly);
  const [form, setForm] = useState(() => fieldsToForm(row, editableFields));
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const saved = await onSave(String(row.id), formToPayload(form, editableFields));
    setSaving(false);
    if (saved) onCancel();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-heading">{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {editableFields.map((field) => (
            <FieldInput
              key={field.key}
              field={field}
              value={form[field.key]}
              onChange={(value) => setForm((current) => ({ ...current, [field.key]: value }))}
            />
          ))}
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1 rounded-xl">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
          </Button>
        </div>
      </form>
    </>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: AdminRecordField;
  value: string | boolean;
  onChange: (value: string | boolean) => void;
}) {
  const id = `admin-field-${field.key}`;
  const commonClass = field.className ?? (field.type === "textarea" || field.type === "image" ? "col-span-2" : undefined);

  if (field.type === "checkbox") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border p-3">
        <input type="checkbox" id={id} checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        <Label htmlFor={id}>{field.label}</Label>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className={commonClass}>
        <Label className="mb-1.5 block">{field.label}</Label>
        <Select value={String(value)} onValueChange={onChange}>
          <SelectTrigger className="rounded-xl w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((option) => (
              <SelectItem key={option} value={option} className="capitalize">
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === "textarea" || field.type === "list") {
    return (
      <div className={commonClass}>
        <Label className="mb-1.5 block">{field.label}</Label>
        <Textarea
          required={field.required}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl min-h-24"
          placeholder={field.placeholder}
        />
      </div>
    );
  }

  if (field.type === "image") {
    return (
      <div className={`${commonClass ?? ""} flex flex-col items-center`}>
        <Label className="mb-2 block self-start">{field.label}</Label>
        <ImageUpload
          value={String(value)}
          onChange={(url) => onChange(url)}
          label={field.placeholder ?? "Upload Image"}
          variant="wide"
          className="w-full"
        />
      </div>
    );
  }

  return (
    <div className={commonClass}>
      <Label className="mb-1.5 block">{field.label}</Label>
      <Input
        required={field.required}
        type={field.type === "number" || field.type === "integer" ? "number" : field.type === "date" ? "date" : "text"}
        step={field.type === "integer" ? "1" : field.type === "number" ? "0.01" : undefined}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl"
        placeholder={field.placeholder}
      />
    </div>
  );
}

function DetailItem({ label, value, className }: { label: string; value: unknown; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-muted/20 p-3 ${className ?? ""}`}>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
      <div className="text-sm text-foreground break-words">{formatValue(value)}</div>
    </div>
  );
}

function fieldsToForm(row: Row, fields: AdminRecordField[]) {
  return fields.reduce<Record<string, string | boolean>>((acc, field) => {
    const value = row[field.key];
    acc[field.key] = field.type === "checkbox" ? Boolean(value) : valueToInput(value);
    return acc;
  }, {});
}

function formToPayload(form: Record<string, string | boolean>, fields: AdminRecordField[]): Row {
  return fields.reduce<Row>((payload, field) => {
    const value = form[field.key];
    if (field.type === "checkbox") {
      payload[field.key] = Boolean(value);
    } else if (field.type === "number") {
      payload[field.key] = optionalNumber(String(value));
    } else if (field.type === "integer") {
      payload[field.key] = optionalInteger(String(value));
    } else if (field.type === "list") {
      payload[field.key] = listFromInput(String(value));
    } else {
      payload[field.key] = optionalText(String(value));
    }
    return payload;
  }, {});
}

function valueToInput(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join(", ");
  return value === null || value === undefined ? "" : String(value);
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function optionalNumber(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : null;
}

function optionalInteger(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? Number.parseInt(trimmed, 10) : null;
}

function listFromInput(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-[10px]">
        {value ? "Yes" : "No"}
      </Badge>
    );
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : <span className="text-muted-foreground">—</span>;
  }
  if (typeof value === "object") {
    return <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(value, null, 2)}</pre>;
  }
  return String(value);
}
