"use client";

import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { LEGAL_DOCUMENT_PATHS } from "@/lib/legal/constants";

type LegalAcceptanceCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
};

export default function LegalAcceptanceCheckbox({
  checked,
  onCheckedChange,
  id = "legal-acceptance",
}: LegalAcceptanceCheckboxProps) {
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        className="mt-0.5"
      />
      <label
        htmlFor={id}
        className="text-sm leading-relaxed text-muted-foreground cursor-pointer"
      >
        I agree to the{" "}
        <Link
          href={LEGAL_DOCUMENT_PATHS.terms}
          className="text-primary hover:underline"
          target="_blank"
        >
          Terms of Service
        </Link>
        ,{" "}
        <Link
          href={LEGAL_DOCUMENT_PATHS.privacy}
          className="text-primary hover:underline"
          target="_blank"
        >
          Privacy Policy
        </Link>
        , and{" "}
        <Link
          href={LEGAL_DOCUMENT_PATHS.liabilityWaiver}
          className="text-primary hover:underline"
          target="_blank"
        >
          Liability Waiver
        </Link>
        .
      </label>
    </div>
  );
}
