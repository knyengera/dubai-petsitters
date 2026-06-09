"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  FileText,
  Loader2,
  Mail,
  Phone,
  Shield,
  Upload,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { getSafeNextPath } from "@/lib/auth/routes";
import {
  hasLegalAcceptance,
  hasProfileDetails,
  isOnboardingComplete,
  resolvePostAuthRedirect,
} from "@/lib/auth/onboarding";
import LegalAcceptanceCheckbox from "@/components/legal/LegalAcceptanceCheckbox";
import { PENDING_LEGAL_ACCEPTANCE_KEY } from "@/lib/legal/constants";
import { recordLegalAcceptance } from "@/lib/legal/actions";
import {
  getProfile,
  saveProfileDetails,
  syncPhoneVerified,
  type ProfileDetailsInput,
} from "@/lib/profile/actions";
import { uploadAppFile } from "@/lib/storage/upload";
import { createClient } from "@/lib/supabase/client";

type Step = "legal" | "profile" | "email" | "phone";

const STEPS: { id: Step; label: string; icon: typeof User }[] = [
  { id: "legal", label: "Legal agreements", icon: FileText },
  { id: "profile", label: "Profile & KYC", icon: User },
  { id: "email", label: "Verify Email", icon: Mail },
  { id: "phone", label: "Verify Phone", icon: Phone },
];

export default function ProfileCompletionWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const { toast } = useToast();
  const {
    user,
    isLoadingAuth,
    isEmailVerified,
    isPhoneVerified,
    resendVerificationEmail,
    sendPhoneOtp,
    verifyPhoneOtp,
  } = useAuth();

  const [step, setStep] = useState<Step>("legal");
  const [loading, setLoading] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    city: "",
    date_of_birth: "",
    gender: "" as ProfileDetailsInput["gender"] | "",
    id_type: "national_id" as ProfileDetailsInput["id_type"],
    id_number: "",
    avatar_url: "",
    id_document_path: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [idDocFile, setIdDocFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getProfile();
      if (profile) {
        setForm({
          full_name: profile.full_name ?? "",
          city: profile.city ?? "",
          date_of_birth: profile.date_of_birth ?? "",
          gender: (profile.gender as ProfileDetailsInput["gender"]) ?? "",
          id_type:
            (profile.id_type as ProfileDetailsInput["id_type"]) ?? "national_id",
          id_number: profile.id_number ?? "",
          avatar_url: profile.avatar_url ?? "",
          id_document_path: profile.id_document_path ?? "",
        });
        if (profile.avatar_url) setAvatarPreview(profile.avatar_url);
        if (profile.phone) setPhone(profile.phone.replace(/^\+966/, ""));
      }
    } catch {
      // Profile may not exist yet for new users
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.replace(`/login?next=${encodeURIComponent("/profile/complete")}`);
      return;
    }
    if (user) loadProfile();
  }, [user, isLoadingAuth, router, loadProfile]);

  useEffect(() => {
    if (!user) return;

    const oauthAvatar =
      (typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : undefined) ||
      (typeof user.user_metadata?.picture === "string"
        ? user.user_metadata.picture
        : undefined);

    if (oauthAvatar) {
      setForm((f) => (f.avatar_url ? f : { ...f, avatar_url: oauthAvatar }));
      setAvatarPreview((prev) => prev ?? oauthAvatar);
    }
  }, [user]);

  useEffect(() => {
    if (!user || isLoadingAuth) return;

    const syncPendingLegalAcceptance = async () => {
      if (typeof window === "undefined") return;
      const pending = sessionStorage.getItem(PENDING_LEGAL_ACCEPTANCE_KEY);
      if (!pending) return;

      const profile = await getProfile();
      if (hasLegalAcceptance(profile)) {
        sessionStorage.removeItem(PENDING_LEGAL_ACCEPTANCE_KEY);
        return;
      }

      const result = await recordLegalAcceptance();
      if (result.success) {
        sessionStorage.removeItem(PENDING_LEGAL_ACCEPTANCE_KEY);
      }
    };

    const checkComplete = async () => {
      await syncPendingLegalAcceptance();
      const profile = await getProfile();
      if (isOnboardingComplete(user, profile)) {
        router.replace(resolvePostAuthRedirect(user, profile, nextPath));
        return;
      }
      if (!hasLegalAcceptance(profile)) {
        setStep("legal");
        return;
      }
      if (hasProfileDetails(profile)) {
        if (!isEmailVerified) setStep("email");
        else if (!isPhoneVerified) setStep("phone");
        else setStep("profile");
      } else {
        setStep("profile");
      }
    };
    checkComplete();
  }, [user, isLoadingAuth, isEmailVerified, isPhoneVerified, router, nextPath]);

  const handleLegalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalAccepted) {
      toast({
        title: "You must accept the legal agreements to continue.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const result = await recordLegalAcceptance();
      if (result.success === false) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }
      toast({ title: "Legal agreements accepted" });
      setStep("profile");
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to record acceptance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleIdDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdDocFile(file);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!avatarFile && !form.avatar_url.trim()) {
      toast({ title: "Profile photo is required.", variant: "destructive" });
      return;
    }
    if (!idDocFile && !form.id_document_path.trim()) {
      toast({ title: "ID document upload is required.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = form.avatar_url;
      let idDocumentPath = form.id_document_path;

      if (avatarFile) {
        avatarUrl = await uploadAppFile("avatars", avatarFile, user.id, "avatar", "avatar");
      }
      if (idDocFile) {
        idDocumentPath = await uploadAppFile(
          "kyc-documents",
          idDocFile,
          user.id,
          "id-document",
          "id-document"
        );
      }

      const result = await saveProfileDetails({
        full_name: form.full_name,
        city: form.city,
        date_of_birth: form.date_of_birth,
        gender: form.gender as ProfileDetailsInput["gender"],
        id_type: form.id_type,
        id_number: form.id_number,
        avatar_url: avatarUrl,
        id_document_path: idDocumentPath,
      });

      if (result.success === false) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }

      toast({ title: "Profile details saved" });
      setStep(isEmailVerified ? "phone" : "email");
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendingEmail(true);
    try {
      await resendVerificationEmail();
      toast({ title: "Verification email sent" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to resend email",
        variant: "destructive",
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      toast({ title: "Enter your phone number", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const e164 = await sendPhoneOtp(phone);
      setVerifiedPhone(e164);
      setOtpSent(true);
      toast({ title: "Verification code sent" });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to send code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast({ title: "Enter the verification code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await verifyPhoneOtp(verifiedPhone || phone, otp);
      const syncResult = await syncPhoneVerified(verifiedPhone || phone);
      if (syncResult.success === false) {
        toast({ title: syncResult.error, variant: "destructive" });
        return;
      }
      toast({ title: "Phone verified — welcome!" });
      const profile = await getProfile();
      router.replace(resolvePostAuthRedirect(user, profile, nextPath));
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAuth || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-8">
      <div className="text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
          <Shield className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Complete your profile</h1>
        <p className="mt-1 text-muted-foreground">
          Verify your identity to access Saudi Petsitters
        </p>
      </div>

      <div className="flex justify-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const stepIndex = STEPS.findIndex((x) => x.id === step);
          const isDone = i < stepIndex;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isDone
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isDone ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          );
        })}
      </div>

      {step === "legal" && (
        <form onSubmit={handleLegalSubmit} className="space-y-6">
          <div className="rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
            Before continuing, please review and accept our legal documents. These
            agreements help protect you and Saudi Petsitters when using the
            platform.
          </div>
          <LegalAcceptanceCheckbox
            checked={legalAccepted}
            onCheckedChange={setLegalAccepted}
            id="legal-acceptance-wizard"
          />
          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={loading || !legalAccepted}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      )}

      {step === "profile" && (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div
              className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted"
              onClick={() => document.getElementById("avatar-input")?.click()}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <Label htmlFor="avatar-input" className="cursor-pointer text-xs text-primary">
              Upload profile photo *
            </Label>
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              required={!form.avatar_url}
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full name *</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              required
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              required
              placeholder="e.g. Riyadh"
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dob">Date of birth *</Label>
              <Input
                id="dob"
                type="date"
                value={form.date_of_birth}
                onChange={(e) =>
                  setForm((f) => ({ ...f, date_of_birth: e.target.value }))
                }
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <select
                id="gender"
                value={form.gender}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    gender: e.target.value as ProfileDetailsInput["gender"],
                  }))
                }
                required
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>ID type *</Label>
            <div className="flex gap-2">
              {(["national_id", "passport"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, id_type: type }))}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    form.id_type === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {type === "national_id" ? "National ID" : "Passport"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_number">
              {form.id_type === "national_id" ? "National ID number *" : "Passport number *"}
            </Label>
            <Input
              id="id_number"
              value={form.id_number}
              onChange={(e) => setForm((f) => ({ ...f, id_number: e.target.value }))}
              required
              placeholder={form.id_type === "national_id" ? "10 digits" : "Passport number"}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="id_doc">ID document (photo or PDF) *</Label>
            <Input
              id="id_doc"
              type="file"
              accept="image/*,application/pdf"
              onChange={handleIdDocChange}
              required={!form.id_document_path && !idDocFile}
              className="rounded-xl"
            />
            {(idDocFile || form.id_document_path) && (
              <p className="text-xs text-muted-foreground">
                {idDocFile?.name ?? "Document uploaded"}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full rounded-xl" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      )}

      {step === "email" && (
        <div className="space-y-6 text-center">
          {isEmailVerified ? (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <p className="text-muted-foreground">Your email is verified.</p>
              <Button
                className="w-full rounded-xl"
                onClick={() => setStep("phone")}
              >
                Continue to phone verification
              </Button>
            </>
          ) : (
            <>
              <Mail className="mx-auto h-12 w-12 text-primary" />
              <div>
                <p className="font-medium">Verify your email</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  We sent a link to <strong>{user.email}</strong>. Click it to verify,
                  then return here.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={handleResendEmail}
                disabled={resendingEmail}
              >
                {resendingEmail ? "Sending…" : "Resend verification email"}
              </Button>
              <Button
                className="w-full rounded-xl"
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.refreshSession();
                  const {
                    data: { user: refreshed },
                  } = await supabase.auth.getUser();
                  if (refreshed?.email_confirmed_at) {
                    setStep("phone");
                  } else {
                    toast({
                      title: "Email not verified yet",
                      description:
                        "Check your inbox and click the verification link.",
                    });
                  }
                }}
              >
                I&apos;ve verified my email
              </Button>
            </>
          )}
        </div>
      )}

      {step === "phone" && (
        <div className="space-y-4">
          {isPhoneVerified ? (
            <div className="space-y-4 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <p className="text-muted-foreground">Your phone is verified.</p>
              <Button
                className="w-full rounded-xl"
                onClick={async () => {
                  const profile = await getProfile();
                  router.replace(resolvePostAuthRedirect(user, profile, nextPath));
                }}
              >
                Go to dashboard
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number *</Label>
                <div className="flex gap-2">
                  <span className="flex h-10 items-center rounded-xl border border-input bg-muted px-3 text-sm text-muted-foreground">
                    +966
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="5XXXXXXXX"
                    className="rounded-xl"
                    disabled={otpSent}
                  />
                </div>
              </div>

              {!otpSent ? (
                <Button
                  className="w-full rounded-xl"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? "Sending…" : "Send verification code"}
                </Button>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification code</Label>
                    <Input
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="6-digit code"
                      maxLength={6}
                      className="rounded-xl text-center text-lg tracking-widest"
                    />
                  </div>
                  <Button
                    className="w-full rounded-xl"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                  >
                    {loading ? "Verifying…" : "Verify phone"}
                  </Button>
                  <button
                    type="button"
                    className="w-full text-sm text-primary hover:underline"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                  >
                    Use a different number
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
