import { createServiceClient, hasServiceRole } from "@/lib/admin/service-client";

export async function autoConfirmEmail(userId: string): Promise<void> {
  if (!hasServiceRole()) {
    throw new Error("Service role is required for email auto-verification");
  }

  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(userId, {
    email_confirm: true,
  });
  if (error) throw error;
}

export async function autoConfirmPhone(
  userId: string,
  phone: string
): Promise<void> {
  if (!hasServiceRole()) {
    throw new Error("Service role is required for phone auto-verification");
  }

  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(userId, {
    phone,
    phone_confirm: true,
  });
  if (error) throw error;
}
