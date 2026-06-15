"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PARTNER_TYPE_FIELDS,
  isFieldVisible,
  type BusinessDetails,
  type PartnerFieldDef,
  type PartnerTypeId,
} from "@/lib/partners/partner-types";

type PartnerTypeFieldsProps = {
  businessTypeId: PartnerTypeId;
  details: BusinessDetails;
  onChange: (details: BusinessDetails) => void;
  errors?: Record<string, string>;
};

function setField(
  details: BusinessDetails,
  key: string,
  value: string | string[] | boolean
): BusinessDetails {
  return { ...details, [key]: value };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

function YesNoField({
  field,
  value,
  onChange,
  error,
}: {
  field: PartnerFieldDef;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <div>
      <Label>
        {field.label}
        {field.required ? " *" : ""}
      </Label>
      <div className="flex gap-2 mt-1">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex-1 h-9 rounded-xl border text-sm font-medium transition-colors ${
            value === true
              ? "bg-primary text-primary-foreground border-primary"
              : "border-input bg-transparent hover:bg-muted"
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex-1 h-9 rounded-xl border text-sm font-medium transition-colors ${
            value === false
              ? "bg-primary text-primary-foreground border-primary"
              : "border-input bg-transparent hover:bg-muted"
          }`}
        >
          No
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}

function MultiSelectField({
  field,
  value,
  onChange,
  error,
}: {
  field: PartnerFieldDef;
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
}) {
  const selected = Array.isArray(value) ? value : [];
  const options = field.options ?? [];

  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((o) => o !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div>
      <Label>
        {field.label}
        {field.required ? " *" : ""}
      </Label>
      <div className="flex flex-wrap gap-2 mt-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              selected.includes(option)
                ? "bg-primary text-primary-foreground border-primary"
                : "border-input bg-transparent hover:bg-muted"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
      <FieldError message={error} />
    </div>
  );
}

function renderField(
  field: PartnerFieldDef,
  details: BusinessDetails,
  onChange: (details: BusinessDetails) => void,
  error?: string
) {
  const value = details[field.key];

  switch (field.inputType) {
    case "text":
    case "comma-list":
      return (
        <div key={field.key}>
          <Label>
            {field.label}
            {field.required ? " *" : ""}
          </Label>
          <Input
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(setField(details, field.key, e.target.value))}
            className="rounded-xl mt-1"
            placeholder={field.placeholder}
          />
          <FieldError message={error} />
        </div>
      );
    case "textarea":
      return (
        <div key={field.key}>
          <Label>
            {field.label}
            {field.required ? " *" : ""}
          </Label>
          <Textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(setField(details, field.key, e.target.value))}
            className="rounded-xl mt-1 text-sm"
            rows={3}
            placeholder={field.placeholder}
          />
          <FieldError message={error} />
        </div>
      );
    case "select":
      return (
        <div key={field.key}>
          <Label>
            {field.label}
            {field.required ? " *" : ""}
          </Label>
          <select
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(setField(details, field.key, e.target.value))}
            className="mt-1 w-full h-9 rounded-xl border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select...</option>
            {(field.options ?? []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <FieldError message={error} />
        </div>
      );
    case "multi-select":
      return (
        <MultiSelectField
          key={field.key}
          field={field}
          value={Array.isArray(value) ? value : []}
          onChange={(v) => onChange(setField(details, field.key, v))}
          error={error}
        />
      );
    case "yes-no":
      return (
        <YesNoField
          key={field.key}
          field={field}
          value={typeof value === "boolean" ? value : undefined}
          onChange={(v) => onChange(setField(details, field.key, v))}
          error={error}
        />
      );
    default:
      return null;
  }
}

export default function PartnerTypeFields({
  businessTypeId,
  details,
  onChange,
  errors = {},
}: PartnerTypeFieldsProps) {
  const fields = PARTNER_TYPE_FIELDS[businessTypeId];
  const detailFields = fields.filter((f) => f.section !== "promo" && isFieldVisible(f, details));
  const promoFields = fields.filter((f) => f.section === "promo");

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-heading text-lg font-bold text-foreground mb-3">Business Details</h3>
        <div className="space-y-4">{detailFields.map((f) => renderField(f, details, onChange, errors[f.key]))}</div>
      </div>

      {promoFields.length > 0 && (
        <div className="pt-2 border-t border-border">
          <h3 className="font-heading text-lg font-bold text-foreground mb-3">Promotion / Special Offer</h3>
          <div className="space-y-4">{promoFields.map((f) => renderField(f, details, onChange, errors[f.key]))}</div>
        </div>
      )}
    </div>
  );
}
