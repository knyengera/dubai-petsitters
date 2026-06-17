import type { AdminRecordField } from "@/components/admin/AdminRecordDialogs";

export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"];
export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"];

export const BOOKING_FIELDS: AdminRecordField[] = [
  { key: "host_id", label: "Host ID", viewOnly: true },
  { key: "pet_name", label: "Pet Name", required: true },
  { key: "pet_type", label: "Pet Type", required: true },
  { key: "service_type", label: "Service Type", required: true },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "end_date", label: "End Date", type: "date" },
  { key: "owner_name", label: "Owner Name", required: true },
  { key: "owner_email", label: "Owner Email", required: true },
  { key: "owner_phone", label: "Owner Phone" },
  { key: "city", label: "City" },
  { key: "special_instructions", label: "Special Instructions", type: "textarea", className: "col-span-2" },
  { key: "quoted_price", label: "Quoted Price", type: "number" },
  { key: "platform_fee", label: "Platform Fee", type: "number" },
  { key: "total_price", label: "Total Price", type: "number" },
  { key: "status", label: "Status", type: "select", options: BOOKING_STATUSES },
  { key: "payment_status", label: "Payment Status", type: "select", options: PAYMENT_STATUSES },
  { key: "escrow_status", label: "Escrow Status", viewOnly: true },
  { key: "release_status", label: "Release Status", viewOnly: true },
];
