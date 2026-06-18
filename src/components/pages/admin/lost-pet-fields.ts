import type { AdminRecordField } from "@/components/admin/AdminRecordDialogs";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";

export const LOST_PET_STATUSES = ["lost", "found", "reunited"];

export const LOST_PET_FIELDS: AdminRecordField[] = [
  { key: "pet_name", label: "Pet Name", required: true },
  { key: "species", label: "Species" },
  { key: "breed", label: "Breed" },
  { key: "description", label: "Description", type: "textarea", className: "col-span-2" },
  { key: "image_url", label: "Photo", type: "image", hideInView: true, uploadCategory: "lost-pets" },
  { key: "last_seen_location", label: "Last Seen Location" },
  { key: "last_seen_date", label: "Last Seen Date", type: "date" },
  {
    key: "reward_offered",
    label: `Reward (${DEFAULT_CURRENCY})`,
    type: "number",
    placeholder: "Optional",
  },
  { key: "contact_name", label: "Contact Name" },
  { key: "contact_phone", label: "Contact Phone" },
  { key: "contact_email", label: "Contact Email" },
  { key: "status", label: "Status", type: "select", options: LOST_PET_STATUSES },
  { key: "created_by", label: "Created By", viewOnly: true },
];
