"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    async function initSession() {
      if (tokenHash && type === "recovery") {
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (verifyError) {
          setError(verifyError.message);
          return;
        }
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
      } else {
        setError("Invalid or expired reset link. Request a new one.");
      }
    }

    initSession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Password updated</h1>
        <p className="text-muted-foreground">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <div className="mt-10 w-full max-w-md space-y-8 lg:mt-14">
      <div className="text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
          <PawPrint className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Set new password</h1>
        <p className="mt-1 text-muted-foreground">Choose a strong password</p>
      </div>

      {!ready && !error ? (
        <p className="text-center text-muted-foreground">Verifying reset link…</p>
      ) : error && !ready ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Request new link
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
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
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="rounded-xl"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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
          <ResetPasswordForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
