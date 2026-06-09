"use client";

import { useState } from "react";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/reset-password`
          : undefined;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo }
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="mt-10 w-full max-w-md space-y-8 lg:mt-14">
          <div className="text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <PawPrint className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Reset password</h1>
            <p className="mt-1 text-muted-foreground">
              Enter your email and we&apos;ll send a reset link
            </p>
          </div>

          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                If an account exists for <strong>{email}</strong>, you&apos;ll
                receive a password reset link shortly.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
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
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
              <p className="text-center text-sm">
                <Link href="/login" className="text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
