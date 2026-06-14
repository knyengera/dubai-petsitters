"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { SignupAccountType } from "@/lib/auth/constants";
import { toE164Phone } from "@/lib/auth/onboarding";

type OAuthProvider = "google" | "apple";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  role: string | null;
  isAdmin: boolean;
  isLoadingAuth: boolean;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    redirectTo?: string,
    metadata?: {
      legal_documents_version: string;
      legal_accepted_at: string;
      signup_account_type?: SignupAccountType;
    }
  ) => Promise<{ needsEmailConfirmation: boolean; userId?: string }>;
  signInWithOAuth: (provider: OAuthProvider, redirectTo: string) => Promise<void>;
  signInWithGoogle: (redirectTo: string) => Promise<void>;
  signInWithApple: (redirectTo: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  sendPhoneOtp: (phone: string) => Promise<string>;
  resendPhoneOtp: (phone: string) => Promise<string>;
  verifyPhoneOtp: (phone: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
  navigateToLogin: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const { error } = await createClient().auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    },
    []
  );

  const signUpWithEmail = useCallback(
    async (
      email: string,
      password: string,
      redirectTo?: string,
      metadata?: {
        legal_documents_version: string;
        legal_accepted_at: string;
        signup_account_type?: SignupAccountType;
      }
    ) => {
      const options: {
        emailRedirectTo?: string;
        data?: Record<string, string>;
      } = {};
      if (redirectTo) options.emailRedirectTo = redirectTo;
      if (metadata) {
        options.data = {
          legal_documents_version: metadata.legal_documents_version,
          legal_accepted_at: metadata.legal_accepted_at,
        };
        if (metadata.signup_account_type) {
          options.data.signup_account_type = metadata.signup_account_type;
        }
      }

      const { data, error } = await createClient().auth.signUp({
        email,
        password,
        options: Object.keys(options).length > 0 ? options : undefined,
      });
      if (error) throw error;
      const needsEmailConfirmation = !data.session;
      return {
        needsEmailConfirmation,
        userId: data.user?.id,
      };
    },
    []
  );

  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider, redirectTo: string) => {
      const { error } = await createClient().auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (error) throw error;
    },
    []
  );

  const signInWithGoogle = useCallback(
    (redirectTo: string) => signInWithOAuth("google", redirectTo),
    [signInWithOAuth]
  );

  const signInWithApple = useCallback(
    (redirectTo: string) => signInWithOAuth("apple", redirectTo),
    [signInWithOAuth]
  );

  const resendVerificationEmail = useCallback(async () => {
    const supabase = createClient();
    const email = (await supabase.auth.getUser()).data.user?.email;
    if (!email) throw new Error("No email address found.");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    if (error) throw error;
  }, []);

  const sendPhoneOtp = useCallback(async (phone: string) => {
    const e164 = toE164Phone(phone);
    const { error } = await createClient().auth.updateUser({ phone: e164 });
    if (error) throw error;
    return e164;
  }, []);

  const resendPhoneOtp = useCallback(async (phone: string) => {
    const e164 = toE164Phone(phone);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "phone_change",
      phone: e164,
    });
    if (!resendError) return e164;

    const { error: updateError } = await supabase.auth.updateUser({ phone: e164 });
    if (updateError) throw updateError;
    return e164;
  }, []);

  const verifyPhoneOtp = useCallback(async (phone: string, token: string) => {
    const e164 = toE164Phone(phone);
    const supabase = createClient();

    const { error: phoneChangeError } = await supabase.auth.verifyOtp({
      phone: e164,
      token,
      type: "phone_change",
    });
    if (!phoneChangeError) return;

    const { error: smsError } = await supabase.auth.verifyOtp({
      phone: e164,
      token,
      type: "sms",
    });
    if (smsError) throw smsError;
  }, []);

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
  }, []);

  const navigateToLogin = useCallback(() => {
    const next =
      typeof window !== "undefined"
        ? encodeURIComponent(
            window.location.pathname + window.location.search
          )
        : "";
    window.location.href = next ? `/login?next=${next}` : "/login";
  }, []);

  const role = (user?.app_metadata?.role as string) ?? null;
  const isAdmin = role === "admin";
  const isEmailVerified = !!user?.email_confirmed_at;
  const isPhoneVerified = !!user?.phone_confirmed_at;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin,
        isLoadingAuth,
        isEmailVerified,
        isPhoneVerified,
        signInWithEmail,
        signUpWithEmail,
        signInWithOAuth,
        signInWithGoogle,
        signInWithApple,
        resendVerificationEmail,
        sendPhoneOtp,
        resendPhoneOtp,
        verifyPhoneOtp,
        signOut,
        navigateToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Compatibility shim for pages that expect `user.email` from Base44 auth. */
export function useAuthUser() {
  const { user, isLoadingAuth } = useAuth();
  return {
    user: user
      ? {
          email: user.email ?? "",
          id: user.id,
          full_name:
            (user.user_metadata?.full_name as string) ??
            user.email?.split("@")[0] ??
            "",
        }
      : null,
    isLoadingAuth,
  };
}
