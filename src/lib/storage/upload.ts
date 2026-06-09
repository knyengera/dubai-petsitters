import { createClient } from "@/lib/supabase/client";

type UploadBucket = "avatars" | "kyc-documents";

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

export async function uploadUserFile(
  bucket: UploadBucket,
  file: File,
  userId: string,
  label: string
): Promise<string> {
  const supabase = createClient();
  const ext = getExtension(file);
  const path = `${userId}/${label}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) throw error;

  if (bucket === "avatars") {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  return path;
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
