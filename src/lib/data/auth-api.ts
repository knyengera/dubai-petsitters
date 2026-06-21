import { createClient } from "@/lib/supabase/client";

export type AuthUser = {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
};

export const authApi = {
  async me(): Promise<AuthUser | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;
    return {
      id: user.id,
      email: user.email,
      full_name:
        (user.user_metadata?.full_name as string) ??
        user.email.split("@")[0],
      role: (user.app_metadata?.role as string) ?? "user",
    };
  },

  redirectToLogin() {
    if (typeof window !== "undefined") {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `/login?next=${next}`;
    }
  },

  async logout(returnTo = "/") {
    const supabase = createClient();
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      window.location.href = returnTo;
    }
  },
};
