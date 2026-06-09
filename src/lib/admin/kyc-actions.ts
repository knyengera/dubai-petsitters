"use server";

import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient, hasServiceRole } from "@/lib/admin/service-client";
import type { AdminActionResult } from "@/lib/admin/actions";

const KYC_SIGNED_URL_EXPIRY = 900;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unknown error";
}

export async function getAdminKycSignedUrl(
  path: string
): Promise<AdminActionResult<string>> {
  try {
    await requireAdmin();

    const trimmedPath = path.trim();
    if (!trimmedPath) {
      return { ok: false, error: "Document path is required." };
    }

    if (!hasServiceRole()) {
      return {
        ok: false,
        error: "SUPABASE_SERVICE_ROLE_KEY is required for KYC document review.",
      };
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(trimmedPath, KYC_SIGNED_URL_EXPIRY);

    if (error) return { ok: false, error: error.message };
    if (!data?.signedUrl) {
      return { ok: false, error: "Could not generate signed URL." };
    }

    return { ok: true, data: data.signedUrl };
  } catch (e) {
    return { ok: false, error: toErrorMessage(e) };
  }
}
