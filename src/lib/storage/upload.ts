import { createClient } from "@/lib/supabase/client";
import { prepareImageForUpload } from "@/lib/storage/convert-to-webp";

export type UploadBucket = "avatars" | "kyc-documents" | "public-uploads";

export type UploadCategory =
  | "pets"
  | "hosts"
  | "vets"
  | "blog"
  | "lost-pets"
  | "partners"
  | "avatar"
  | "id-document";

const PUBLIC_BUCKETS: UploadBucket[] = ["avatars", "public-uploads"];

function getExtension(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length <= 5) return fromName;
  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
  };
  return mimeMap[file.type] ?? "bin";
}

function buildStoragePath(
  userId: string,
  category: UploadCategory,
  label: string,
  ext: string
): string {
  return `${userId}/${category}/${label}-${Date.now()}.${ext}`;
}

export async function uploadAppFile(
  bucket: UploadBucket,
  file: File,
  userId: string,
  category: UploadCategory,
  label = "file"
): Promise<string> {
  const supabase = createClient();
  const uploadFile = await prepareImageForUpload(file);
  const ext = getExtension(uploadFile);
  const path = buildStoragePath(userId, category, label, ext);

  const { error } = await supabase.storage.from(bucket).upload(path, uploadFile, {
    upsert: true,
    contentType: uploadFile.type || undefined,
  });

  if (error) throw error;

  if (PUBLIC_BUCKETS.includes(bucket)) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  return path;
}

/** @deprecated Use uploadAppFile instead */
export async function uploadUserFile(
  bucket: "avatars" | "kyc-documents",
  file: File,
  userId: string,
  label: string
): Promise<string> {
  const category: UploadCategory =
    bucket === "avatars" ? "avatar" : "id-document";
  return uploadAppFile(bucket, file, userId, category, label);
}

export async function getKycDocumentSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("kyc-documents")
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}
