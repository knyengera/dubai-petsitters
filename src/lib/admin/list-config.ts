import type { AdminTable } from "@/lib/admin/tables";
import { ADMIN_TABLES } from "@/lib/admin/tables";
import { USER_ROLES } from "@/components/pages/admin/user-fields";
import { BOOKING_STATUSES } from "@/components/pages/admin/booking-fields";
import { PET_STATUSES } from "@/components/pages/admin/pet-fields";
import { LOST_PET_STATUSES } from "@/components/pages/admin/lost-pet-fields";
import { PARTNER_TYPES } from "@/lib/partners/partner-types";

export const ADMIN_PAGE_SIZE = 20;

export type AdminFilterOption = { value: string; label: string };

export type AdminFilterDef = {
  key: string;
  column: string;
  label: string;
  options: AdminFilterOption[];
  /** When true, option values "true"/"false" are coerced to booleans for the query. */
  boolean?: boolean;
};

export type AdminListConfig = {
  searchColumns?: string[];
  filters?: AdminFilterDef[];
  defaultOrder?: string;
};

function titleCase(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusOptions(values: readonly string[]): AdminFilterOption[] {
  return values.map((value) => ({ value, label: titleCase(value) }));
}

const BOOLEAN_OPTIONS = (yes: string, no: string): AdminFilterOption[] => [
  { value: "true", label: yes },
  { value: "false", label: no },
];

export const ADMIN_LIST_CONFIG: Partial<Record<AdminTable, AdminListConfig>> = {
  [ADMIN_TABLES.profiles]: {
    searchColumns: ["full_name", "email", "city"],
    filters: [
      {
        key: "role",
        column: "role",
        label: "Role",
        options: statusOptions(USER_ROLES),
      },
    ],
  },
  [ADMIN_TABLES.hosting_bookings]: {
    searchColumns: ["pet_name", "owner_name", "owner_email", "city"],
    filters: [
      {
        key: "status",
        column: "status",
        label: "Status",
        options: statusOptions(BOOKING_STATUSES),
      },
    ],
  },
  [ADMIN_TABLES.pets]: {
    searchColumns: ["name", "breed", "location", "created_by"],
    filters: [
      {
        key: "status",
        column: "status",
        label: "Status",
        options: statusOptions(PET_STATUSES),
      },
    ],
  },
  [ADMIN_TABLES.pet_hosts]: {
    searchColumns: ["full_name", "city", "neighborhood"],
    defaultOrder: "-rating",
    filters: [
      {
        key: "is_available",
        column: "is_available",
        label: "Availability",
        boolean: true,
        options: BOOLEAN_OPTIONS("Available", "Unavailable"),
      },
    ],
  },
  [ADMIN_TABLES.vet_clinics]: {
    searchColumns: ["name", "city", "email", "phone"],
    filters: [
      {
        key: "business_type",
        column: "business_type",
        label: "Type",
        options: PARTNER_TYPES.map((type) => ({ value: type.label, label: type.label })),
      },
      {
        key: "is_approved",
        column: "is_approved",
        label: "Approval",
        boolean: true,
        options: BOOLEAN_OPTIONS("Approved", "Pending"),
      },
    ],
  },
  [ADMIN_TABLES.lost_pets]: {
    searchColumns: ["pet_name", "breed", "last_seen_location", "owner_name"],
    filters: [
      {
        key: "status",
        column: "status",
        label: "Status",
        options: statusOptions(LOST_PET_STATUSES),
      },
    ],
  },
  [ADMIN_TABLES.adoption_requests]: {
    searchColumns: ["applicant_name", "applicant_email", "city"],
    filters: [
      {
        key: "status",
        column: "status",
        label: "Status",
        options: statusOptions(["pending", "approved", "rejected"]),
      },
    ],
  },
  [ADMIN_TABLES.appointments]: {
    searchColumns: ["pet_name", "clinic_name", "owner_name", "owner_email"],
    defaultOrder: "-date",
    filters: [
      {
        key: "status",
        column: "status",
        label: "Status",
        options: statusOptions(["pending", "confirmed", "completed", "cancelled"]),
      },
    ],
  },
  [ADMIN_TABLES.payments]: {
    searchColumns: ["payer_name", "payer_email", "reference_id"],
    filters: [
      {
        key: "status",
        column: "status",
        label: "Status",
        options: statusOptions([
          "pending",
          "requires_payment",
          "captured",
          "completed",
          "failed",
          "refunded",
        ]),
      },
    ],
  },
  [ADMIN_TABLES.partner_deals]: {
    searchColumns: ["title", "partner_name"],
    filters: [
      {
        key: "is_active",
        column: "is_active",
        label: "Status",
        boolean: true,
        options: BOOLEAN_OPTIONS("Active", "Inactive"),
      },
    ],
  },
  [ADMIN_TABLES.partner_inquiries]: {
    searchColumns: ["business_name", "contact_name", "email", "city"],
    filters: [
      {
        key: "status",
        column: "status",
        label: "Status",
        options: statusOptions(["new", "contacted", "converted", "closed"]),
      },
    ],
  },
  [ADMIN_TABLES.advertising_plans]: {
    searchColumns: ["name"],
    defaultOrder: "sort_order",
  },
  [ADMIN_TABLES.vet_subscriptions]: {
    searchColumns: ["clinic_name", "contact_name", "contact_email", "city"],
    filters: [
      {
        key: "status",
        column: "status",
        label: "Status",
        options: statusOptions([
          "pending",
          "pending_payment",
          "active",
          "cancelled",
          "expired",
        ]),
      },
    ],
  },
  [ADMIN_TABLES.reviews]: {
    searchColumns: ["author_name", "author_email", "target_type"],
  },
  [ADMIN_TABLES.blog_posts]: {
    searchColumns: ["title", "slug", "author_name"],
    filters: [
      {
        key: "status",
        column: "status",
        label: "Status",
        options: statusOptions(["draft", "scheduled", "published", "trash"]),
      },
    ],
  },
  [ADMIN_TABLES.forum_boards]: {
    searchColumns: ["title", "slug"],
    defaultOrder: "display_order",
  },
};

export function getAdminListConfig(table: AdminTable): AdminListConfig {
  return ADMIN_LIST_CONFIG[table] ?? {};
}
