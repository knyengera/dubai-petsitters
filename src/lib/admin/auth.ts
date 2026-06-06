import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/auth/routes";
import type { User } from "@supabase/supabase-js";

export type AdminUser = {
  id: string;
  email: string;
  role: string;
};

export class AdminAuthError extends Error {
  constructor(message = "Admin access required") {
    super(message);
    this.name = "AdminAuthError";
  }
}

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const user = await getSessionUser();
  if (!user?.email || !isAdminRole(user.app_metadata)) return null;
  return {
    id: user.id,
    email: user.email,
    role: (user.app_metadata?.role as string) ?? "admin",
  };
}

/** Throws if the current session is not an admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) throw new AdminAuthError();
  return admin;
}
