"use client";

import { Mail, Phone, User } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ListingContactActionsProps = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  /** Heading shown above the contact, e.g. "Owner" or "Listed by". */
  heading?: string;
};

function clean(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export default function ListingContactActions({
  name,
  email,
  phone,
  heading,
}: ListingContactActionsProps) {
  const { t } = useLanguage();
  const contactName = clean(name);
  const contactEmail = clean(email);
  const contactPhone = clean(phone);

  if (!contactName && !contactEmail && !contactPhone) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("No contact details provided.", "لا توجد تفاصيل اتصال.")}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {heading ? (
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {heading}
        </p>
      ) : null}

      {contactName ? (
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <User className="w-4 h-4 text-muted-foreground shrink-0" />
          {contactName}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-2">
        {contactPhone ? (
          <a
            href={`tel:${contactPhone}`}
            className={cn(buttonVariants({ variant: "default" }), "flex-1 rounded-xl")}
          >
            <Phone className="w-4 h-4 me-2" />
            {t("Call", "اتصال")}
          </a>
        ) : null}
        {contactEmail ? (
          <a
            href={`mailto:${contactEmail}`}
            className={cn(buttonVariants({ variant: "outline" }), "flex-1 rounded-xl")}
          >
            <Mail className="w-4 h-4 me-2" />
            {t("Email", "بريد إلكتروني")}
          </a>
        ) : null}
      </div>
    </div>
  );
}
