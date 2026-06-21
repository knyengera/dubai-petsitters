"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import {
  adminGetAuthSettings,
  adminUpdateAuthSettings,
  type PlatformAuthSettingsRow,
} from "@/lib/auth/actions";

export default function AdminAuthSettings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [settings, setSettings] = useState<PlatformAuthSettingsRow | null>(null);

  useEffect(() => {
    adminGetAuthSettings().then((result) => {
      if (result.ok) setSettings(result.data);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (
    field: "email" | "phone" | "google" | "apple",
    enabled: boolean
  ) => {
    setSaving(field);
    const payload = {
      email: { emailVerificationEnabled: enabled },
      phone: { phoneVerificationEnabled: enabled },
      google: { googleOauthEnabled: enabled },
      apple: { appleOauthEnabled: enabled },
    }[field];
    const result = await adminUpdateAuthSettings(payload);
    setSaving(null);

    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }

    setSettings(result.data);

    const messages: Record<typeof field, string> = {
      email: enabled
        ? "New users must confirm their email."
        : "New users will have email auto-verified.",
      phone: enabled
        ? "Users must verify phone via SMS OTP."
        : "Phone numbers will be auto-verified without SMS.",
      google: enabled
        ? "Google sign-in is shown on the login page."
        : "Google sign-in is hidden on the login page.",
      apple: enabled
        ? "Apple sign-in is shown on the login page."
        : "Apple sign-in is hidden on the login page.",
    };

    toast({
      title: enabled ? "Setting enabled" : "Setting disabled",
      description: messages[field],
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="pb-10">
        <AdminPageHeader
          title="Auth Settings"
          description="Configure email and phone verification requirements."
        />
        <p className="text-sm text-muted-foreground">Auth settings could not be loaded.</p>
      </div>
    );
  }

  const bothDisabled =
    !settings.email_verification_enabled && !settings.phone_verification_enabled;

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Auth Settings"
        description="Enable or disable email confirmation and phone SMS verification for new and existing users in onboarding."
      />

      {bothDisabled && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-800 dark:text-amber-200">
          Both email and phone verification are disabled. Accounts will be auto-verified
          during onboarding — useful for development, but reduces account security in
          production.
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <p className="font-semibold text-foreground">Email verification</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require email confirmation link before account access. When disabled, email
              is auto-verified on signup and during onboarding.
            </p>
          </div>
          <Switch
            checked={settings.email_verification_enabled}
            disabled={saving === "email"}
            onCheckedChange={(checked) => handleToggle("email", checked)}
            aria-label="Toggle email verification"
          />
        </div>

        <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <p className="font-semibold text-foreground">Phone SMS verification</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require SMS OTP before phone is marked verified. When disabled, users still
              enter a phone number but it is auto-verified without sending a code.
            </p>
          </div>
          <Switch
            checked={settings.phone_verification_enabled}
            disabled={saving === "phone"}
            onCheckedChange={(checked) => handleToggle("phone", checked)}
            aria-label="Toggle phone SMS verification"
          />
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-sm font-semibold text-muted-foreground">
        Social sign-in providers
      </h2>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border">
        <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary shrink-0" />
              <p className="font-semibold text-foreground">Google sign-in</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Show the &quot;Continue with Google&quot; button on the login page. When
              disabled, the button is hidden for all users.
            </p>
          </div>
          <Switch
            checked={settings.google_oauth_enabled}
            disabled={saving === "google"}
            onCheckedChange={(checked) => handleToggle("google", checked)}
            aria-label="Toggle Google sign-in"
          />
        </div>

        <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary shrink-0" />
              <p className="font-semibold text-foreground">Apple sign-in</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Show the &quot;Continue with Apple&quot; button on the login page. When
              disabled, the button is hidden for all users.
            </p>
          </div>
          <Switch
            checked={settings.apple_oauth_enabled}
            disabled={saving === "apple"}
            onCheckedChange={(checked) => handleToggle("apple", checked)}
            aria-label="Toggle Apple sign-in"
          />
        </div>
      </div>
    </div>
  );
}
