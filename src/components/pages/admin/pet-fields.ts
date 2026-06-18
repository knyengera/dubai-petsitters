import type { AdminRecordField } from "@/components/admin/AdminRecordDialogs";

export const PET_STATUSES = ["available", "pending_review", "pending", "adopted"];
export const PET_SPECIES = ["dog", "cat", "bird", "rabbit", "fish", "reptile", "other"];

export const PET_FIELDS: AdminRecordField[] = [
  { key: "name", label: "Name", required: true },
  { key: "species", label: "Species", type: "select", options: PET_SPECIES, required: true },
  { key: "breed", label: "Breed" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender", type: "select", options: ["male", "female"] },
  { key: "size", label: "Size", type: "select", options: ["small", "medium", "large"] },
  { key: "description", label: "Description", type: "textarea", className: "col-span-2" },
  { key: "image_url", label: "Photo", type: "image", hideInView: true, uploadCategory: "pets" },
  { key: "location", label: "Location" },
  { key: "vaccinated", label: "Vaccinated", type: "checkbox" },
  { key: "neutered", label: "Neutered", type: "checkbox" },
  { key: "status", label: "Status", type: "select", options: PET_STATUSES },
  { key: "poster_name", label: "Poster Name" },
  { key: "poster_phone", label: "Poster Phone" },
  { key: "poster_email", label: "Poster Email" },
  { key: "created_by", label: "Listed By" },
];
