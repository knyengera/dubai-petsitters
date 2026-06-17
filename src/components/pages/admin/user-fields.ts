import type { AdminRecordField } from "@/components/admin/AdminRecordDialogs";

export const USER_ROLES = ["user", "admin", "host", "vet"] as const;

export const USER_FIELDS: AdminRecordField[] = [
  { key: "full_name", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role", viewOnly: true },
  { key: "city", label: "City" },
  { key: "date_of_birth", label: "Date of Birth" },
  { key: "id_type", label: "ID Type" },
  { key: "id_number", label: "ID Number" },
  { key: "id_document_path", label: "ID Document Path" },
  { key: "phone", label: "Phone" },
  { key: "profile_completed_at", label: "Profile Completed" },
  {
    key: "avatar_url",
    label: "Avatar",
    type: "image",
    hideInView: true,
    uploadCategory: "avatar",
    uploadBucket: "avatars",
  },
];
