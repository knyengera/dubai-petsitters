"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeNextPath } from "@/lib/auth/routes";
import { getPostAuthRedirectPath } from "@/lib/auth/post-auth";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import LegalAcceptanceCheckbox from "@/components/legal/LegalAcceptanceCheckbox";
import {
  LEGAL_DOCUMENTS_VERSION,
  PENDING_LEGAL_ACCEPTANCE_KEY,
} from "@/lib/legal/constants";
import { recordLegalAcceptance } from "@/lib/legal/actions";
import { autoConfirmEmailIfDisabled } from "@/lib/auth/actions";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const urlError = searchParams.get("error");

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
      : `/auth/callback?next=${encodeURIComponent(nextPath)}`;

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    if (isSignUp && !legalAccepted) {
      setError("You must accept the legal agreements to continue.");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp && typeof window !== "undefined") {
        sessionStorage.setItem(
          PENDING_LEGAL_ACCEPTANCE_KEY,
          JSON.stringify({
            version: LEGAL_DOCUMENTS_VERSION,
            accepted_at: new Date().toISOString(),
          })
        );
      }
      if (provider === "google") {
        await signInWithGoogle(callbackUrl);
      } else {
        await signInWithApple(callbackUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (isSignUp && !legalAccepted) {
      setError("You must accept the legal agreements to continue.");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const acceptedAt = new Date().toISOString();
        const legalMetadata = {
          legal_documents_version: LEGAL_DOCUMENTS_VERSION,
          legal_accepted_at: acceptedAt,
        };
        const emailRedirectTo =
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
            : undefined;
        const { needsEmailConfirmation, userId } = await signUpWithEmail(
          email,
          password,
          emailRedirectTo,
          legalMetadata
        );
        if (needsEmailConfirmation) {
          const autoConfirm = await autoConfirmEmailIfDisabled(
            userId && email ? { userId, email } : undefined
          );
          if (autoConfirm.confirmed) {
            await signInWithEmail(email, password);
            const acceptanceResult = await recordLegalAcceptance();
            if (acceptanceResult.success === false) {
              setError(acceptanceResult.error);
              return;
            }
          } else {
            setEmailConfirmationSent(true);
            return;
          }
        } else {
          const acceptanceResult = await recordLegalAcceptance();
          if (acceptanceResult.success === false) {
            setError(acceptanceResult.error);
            return;
          }
        }
      } else {
        await signInWithEmail(email, password);
      }
      const redirectPath = await getPostAuthRedirectPath(nextPath);
      router.push(redirectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  if (emailConfirmationSent) {
    return (
      <div className="mt-10 w-full max-w-md space-y-6 text-center lg:mt-14">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
          <PawPrint className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="text-muted-foreground">
          We sent a verification link to <strong>{email}</strong>. Click the link
          to verify your account, then sign in.
        </p>
        <Button
          variant="outline"
          className="rounded-xl"
          onClick={() => {
            setEmailConfirmationSent(false);
            setIsSignUp(false);
          }}
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-10 w-full max-w-md space-y-8 lg:mt-14">
      <div className="text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
          <PawPrint className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Saudi Petsitters</h1>
        <p className="mt-1 text-muted-foreground">
          {isSignUp ? "Create your account" : "Sign in to continue"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {!isSignUp && (
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="rounded-xl"
          />
        </div>
        {(error || urlError) && (
          <p className="text-sm text-destructive">{error ?? urlError}</p>
        )}
        {isSignUp && (
          <LegalAcceptanceCheckbox
            checked={legalAccepted}
            onCheckedChange={setLegalAccepted}
          />
        )}
        <Button
          type="submit"
          className="w-full rounded-xl"
          disabled={loading || (isSignUp && !legalAccepted)}
        >
          {loading ? "Please wait…" : isSignUp ? "Sign up" : "Sign in"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl"
          disabled={loading || (isSignUp && !legalAccepted)}
          onClick={() => handleOAuth("google")}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-xl"
          disabled={loading || (isSignUp && !legalAccepted)}
          onClick={() => handleOAuth("apple")}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Continue with Apple
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        <button
          type="button"
          className="text-primary hover:underline"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setLegalAccepted(false);
            setError(null);
          }}
        >
          {isSignUp
            ? "Already have an account? Sign in"
            : "Need an account? Sign up"}
        </button>
      </p>

      <p className="text-center">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-primary"
        >
          ← Back to home
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main
        className="flex flex-1 items-start justify-center px-4 py-8"
        style={{
          paddingTop: "calc(5rem + env(safe-area-inset-top))",
          paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
        }}
      >
        <Suspense
          fallback={
            <div className="w-full max-w-md text-center text-muted-foreground">
              Loading…
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
