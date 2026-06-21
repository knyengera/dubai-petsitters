"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  FileText,
  Home,
  Loader2,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
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
  PENDING_SIGNUP_ACCOUNT_TYPE_KEY,
  normalizeSignupAccountType,
  type SignupAccountType,
} from "@/lib/auth/constants";
import {
  getSignupAccountType,
  hasLegalAcceptance,
  hasProfileDetails,
  isHostSignup,
  isOnboardingComplete,
  isValidE164Phone,
  needsIdentityVerification,
  resolvePostAuthRedirect,
  sanitizePhoneInput,
  toE164Phone,
} from "@/lib/auth/onboarding";
import LegalAcceptanceCheckbox from "@/components/legal/LegalAcceptanceCheckbox";
import { PENDING_LEGAL_ACCEPTANCE_KEY } from "@/lib/legal/constants";
import { recordLegalAcceptance } from "@/lib/legal/actions";
import {
  autoConfirmEmailIfDisabled,
  getVerificationSettingsForClient,
  savePhoneWithoutVerification,
} from "@/lib/auth/actions";
import type { AuthVerificationSettings } from "@/lib/auth/verification-settings";
import {
  getProfile,
  saveProfileDetails,
  saveSignupAccountType,
  syncPhoneVerified,
  userHasHostProfile,
  type ProfileDetailsInput,
} from "@/lib/profile/actions";
import { uploadAppFile } from "@/lib/storage/upload";
import { createClient } from "@/lib/supabase/client";
import HostProfileFormFields from "@/components/host/HostProfileFormFields";
import IdentityVerificationPanel from "@/components/profile/IdentityVerificationPanel";
import {
  emptyHostProfileForm,
  hostFormToPayload,
} from "@/lib/hosting/host-profile-form";
import { entities } from "@/lib/data/entities";

type Step = "legal" | "profile" | "identity" | "email" | "phone" | "host";

const BASE_STEPS: { id: Step; label: string; icon: typeof User }[] = [
  { id: "legal", label: "Legal agreements", icon: FileText },
  { id: "profile", label: "Profile & KYC", icon: User },
  { id: "email", label: "Verify Email", icon: Mail },
  { id: "phone", label: "Verify Phone", icon: Phone },
];

const IDENTITY_STEP: { id: Step; label: string; icon: typeof User } = {
  id: "identity",
  label: "Verify ID",
  icon: ShieldCheck,
};

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
    resendPhoneOtp,
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
  const [identityVerified, setIdentityVerified] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationSettings, setVerificationSettings] =
    useState<AuthVerificationSettings>({
      emailVerificationEnabled: true,
      phoneVerificationEnabled: true,
    });
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [signupAccountType, setSignupAccountType] =
    useState<SignupAccountType>("client");
  const [hostForm, setHostForm] = useState(emptyHostProfileForm());
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [hostCoverUrl, setHostCoverUrl] = useState("");
  const [hostGalleryUrls, setHostGalleryUrls] = useState<string[]>([]);

  const steps = useMemo(() => {
    if (signupAccountType === "host") {
      return [
        BASE_STEPS[0], // Legal
        IDENTITY_STEP, // Verify ID
        BASE_STEPS[1], // Profile & KYC
        BASE_STEPS[2], // Email
        BASE_STEPS[3], // Phone
        { id: "host" as const, label: "Host profile", icon: Home },
      ];
    }
    return BASE_STEPS;
  }, [signupAccountType]);

  const finishOrAdvanceAfterPhone = useCallback(async () => {
    const profile = await getProfile();
    const hasHostProfile = await userHasHostProfile();
    if (isHostSignup(profile) && !hasHostProfile) {
      setStep("host");
      return;
    }
    router.replace(
      resolvePostAuthRedirect(user, profile, nextPath, { hasHostProfile })
    );
  }, [user, router, nextPath]);

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
        if (profile.phone) setPhone(profile.phone);
        setSignupAccountType(getSignupAccountType(profile));
        setIdentityVerified(profile.id_verification_status === "verified");
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
    getVerificationSettingsForClient().then((settings) => {
      setVerificationSettings(settings);
      setSettingsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!user || isLoadingAuth || !settingsLoaded) return;

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

    const syncPendingSignupAccountType = async () => {
      const profile = await getProfile();
      if (profile?.signup_account_type) {
        setSignupAccountType(profile.signup_account_type);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(PENDING_SIGNUP_ACCOUNT_TYPE_KEY);
        }
        return;
      }

      let type: SignupAccountType = "client";
      if (typeof window !== "undefined") {
        const pending = sessionStorage.getItem(PENDING_SIGNUP_ACCOUNT_TYPE_KEY);
        if (pending === "host" || pending === "client") {
          type = pending;
        }
      }
      const metadataType = normalizeSignupAccountType(
        user.user_metadata?.signup_account_type
      );
      if (metadataType) type = metadataType;

      const result = await saveSignupAccountType(type);
      if (result.success) {
        setSignupAccountType(type);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(PENDING_SIGNUP_ACCOUNT_TYPE_KEY);
        }
      }
    };

    const checkComplete = async () => {
      await syncPendingLegalAcceptance();
      await syncPendingSignupAccountType();

      if (
        !verificationSettings.emailVerificationEnabled &&
        !isEmailVerified
      ) {
        const autoConfirm = await autoConfirmEmailIfDisabled();
        if (autoConfirm.confirmed) {
          const supabase = createClient();
          await supabase.auth.refreshSession();
        }
      }

      const supabase = createClient();
      const {
        data: { user: freshUser },
      } = await supabase.auth.getUser();
      const activeUser = freshUser ?? user;

      const profile = await getProfile();
      const hasHostProfile = await userHasHostProfile();
      if (isOnboardingComplete(activeUser, profile, { hasHostProfile })) {
        router.replace(
          resolvePostAuthRedirect(activeUser, profile, nextPath, {
            hasHostProfile,
          })
        );
        return;
      }
      setIdentityVerified(profile?.id_verification_status === "verified");

      if (!hasLegalAcceptance(profile)) {
        setStep("legal");
        return;
      }
      // Hosts verify their ID before filling in KYC, so the captured details
      // (DOB, gender, ID type/number) pre-fill the profile step.
      if (needsIdentityVerification(profile)) {
        setStep("identity");
        return;
      }
      if (!hasProfileDetails(profile)) {
        setStep("profile");
        return;
      }
      const emailVerified =
        !!activeUser.email_confirmed_at ||
        !verificationSettings.emailVerificationEnabled;
      const phoneVerified =
        !!activeUser.phone_confirmed_at ||
        !verificationSettings.phoneVerificationEnabled;
      if (!emailVerified) setStep("email");
      else if (!phoneVerified) setStep("phone");
      else if (isHostSignup(profile) && !hasHostProfile) setStep("host");
      else setStep("profile");
    };
    checkComplete();
  }, [
    user,
    isLoadingAuth,
    isEmailVerified,
    isPhoneVerified,
    settingsLoaded,
    verificationSettings.emailVerificationEnabled,
    router,
    nextPath,
  ]);

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
      setStep(signupAccountType === "host" ? "identity" : "profile");
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
    const isHost = signupAccountType === "host";
    if (!isHost && !idDocFile && !form.id_document_path.trim()) {
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
      setStep(
        isEmailVerified || !verificationSettings.emailVerificationEnabled
          ? "phone"
          : "email"
      );
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIdentityVerified = useCallback(async () => {
    toast({ title: "Identity verified" });
    setIdentityVerified(true);
    // Pull the details Stripe extracted from the document so the KYC step is
    // pre-filled with verified data.
    const profile = await getProfile();
    if (profile) {
      setForm((f) => ({
        ...f,
        full_name: profile.full_name?.trim() || f.full_name,
        date_of_birth: profile.date_of_birth ?? f.date_of_birth,
        gender: (profile.gender as ProfileDetailsInput["gender"]) || f.gender,
        id_type:
          (profile.id_type as ProfileDetailsInput["id_type"]) || f.id_type,
        id_number: profile.id_number ?? f.id_number,
      }));
    }
    setStep("profile");
  }, [toast]);

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
    if (!isValidE164Phone(phone)) {
      toast({
        title: "Invalid phone number",
        description: "Include your country code, e.g. +966 5XX XXX XXXX or +1 555 123 4567.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const e164 = otpSent
        ? await resendPhoneOtp(phone)
        : await sendPhoneOtp(phone);
      setVerifiedPhone(e164);
      setOtpSent(true);
      toast({
        title: otpSent ? "Verification code resent" : "Verification code sent",
        description: `Check SMS for ${toE164Phone(phone)}`,
      });
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to send code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhone = async () => {
    if (!phone.trim()) {
      toast({ title: "Enter your phone number", variant: "destructive" });
      return;
    }
    if (!isValidE164Phone(phone)) {
      toast({
        title: "Invalid phone number",
        description: "Include your country code, e.g. +966 5XX XXX XXXX or +1 555 123 4567.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const result = await savePhoneWithoutVerification(phone);
      if (result.success === false) {
        toast({ title: result.error, variant: "destructive" });
        return;
      }
      const supabase = createClient();
      await supabase.auth.refreshSession();
      toast({ title: "Phone saved — welcome!" });
      await finishOrAdvanceAfterPhone();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to save phone",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpSent) {
      toast({
        title: "Send a verification code first",
        variant: "destructive",
      });
      return;
    }
    if (!otp.trim() || otp.length < 6) {
      toast({ title: "Enter the 6-digit verification code", variant: "destructive" });
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
      await finishOrAdvanceAfterPhone();
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Invalid verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (step !== "host") return;
    setHostForm((f) => ({
      ...f,
      full_name: f.full_name || form.full_name,
      city: f.city || form.city,
    }));
    setHostCoverUrl((prev) => prev || form.avatar_url || avatarPreview || "");
  }, [step, form.full_name, form.city, form.avatar_url, avatarPreview]);

  const handleHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (selectedServices.length === 0) {
      toast({
        title: "Please select at least one service",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const payload = hostFormToPayload(
        hostForm,
        selectedServices,
        hostCoverUrl || null,
        hostGalleryUrls
      );
      await entities.PetHost.create({
        ...payload,
        is_available: true,
        created_by: user.email,
        user_id: user.id,
      });
      toast({ title: "Host profile created!" });
      const profile = await getProfile();
      router.replace(
        resolvePostAuthRedirect(user, profile, nextPath, { hasHostProfile: true })
      );
    } catch (err) {
      toast({
        title: "Submission failed",
        description:
          err instanceof Error ? err.message : "Could not create host profile",
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

  // For verified hosts, fields captured from the ID document are locked when
  // Stripe returned a value, and stay editable as a fallback when it didn't.
  const isHostVerifiedKyc = signupAccountType === "host" && identityVerified;
  const lockDob = isHostVerifiedKyc && !!form.date_of_birth;
  const lockGender = isHostVerifiedKyc && !!form.gender;
  const lockIdType = isHostVerifiedKyc && !!form.id_type;
  const lockIdNumber = isHostVerifiedKyc && !!form.id_number.trim();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="text-center">
        <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
          <Shield className="h-7 w-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Complete your profile</h1>
        <p className="mt-1 text-muted-foreground">
          Verify your identity to access Saudi Petsitters
        </p>
      </div>

      <div className="flex w-full flex-wrap justify-center gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const stepIndex = steps.findIndex((x) => x.id === step);
          const isDone = i < stepIndex;
          return (
            <div
              key={s.id}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isDone
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {isDone ? (
                <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <Icon className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{s.label}</span>
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
                readOnly={lockDob}
                aria-readonly={lockDob}
                className={`rounded-xl ${lockDob ? "bg-muted/60 text-muted-foreground" : ""}`}
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
                disabled={lockGender}
                className={`flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ${
                  lockGender ? "bg-muted/60 text-muted-foreground" : ""
                }`}
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
                  disabled={lockIdType}
                  onClick={() =>
                    !lockIdType && setForm((f) => ({ ...f, id_type: type }))
                  }
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                    form.id_type === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  } ${lockIdType ? "cursor-not-allowed opacity-70" : ""}`}
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
              readOnly={lockIdNumber}
              aria-readonly={lockIdNumber}
              placeholder={form.id_type === "national_id" ? "10 digits" : "Passport number"}
              className={`rounded-xl ${lockIdNumber ? "bg-muted/60 text-muted-foreground" : ""}`}
            />
          </div>

          {isHostVerifiedKyc ? (
            <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Date of birth, gender, ID type and ID number were captured from
                your verified ID and can&apos;t be edited. Add your name, city
                and a profile photo to continue.
              </span>
            </div>
          ) : signupAccountType === "host" ? (
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Verify your ID with a quick photo and selfie to auto-fill these
              details.
            </div>
          ) : (
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
          )}

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

      {step === "identity" && (
        <IdentityVerificationPanel
          userId={user.id}
          onVerified={handleIdentityVerified}
        />
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
                onClick={finishOrAdvanceAfterPhone}
              >
                {signupAccountType === "host" ? "Continue to host profile" : "Go to dashboard"}
              </Button>
            </div>
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground">
                {verificationSettings.phoneVerificationEnabled
                  ? "Enter your mobile number with country code. We'll text you a 6-digit code to verify it."
                  : "Enter your mobile number with country code. It will be saved to your account."}
              </p>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                  placeholder="+966 5XX XXX XXXX or +1 555 123 4567"
                  className="rounded-xl"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Saudi numbers can be entered as 5XXXXXXXX — we&apos;ll add +966
                  automatically.
                </p>
              </div>

              {verificationSettings.phoneVerificationEnabled ? (
                <>
                  <Button
                    type="button"
                    variant={otpSent ? "outline" : "default"}
                    className="w-full rounded-xl"
                    onClick={handleSendOtp}
                    disabled={loading || !phone.trim()}
                  >
                    {loading
                      ? "Sending…"
                      : otpSent
                        ? "Resend verification code"
                        : "Send verification code"}
                  </Button>

                  {otpSent ? (
                    <p className="text-center text-xs text-muted-foreground">
                      Code sent to {toE164Phone(verifiedPhone || phone)}
                    </p>
                  ) : null}

                  <div className="space-y-2">
                    <Label htmlFor="otp">Verification code *</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder={otpSent ? "Enter 6-digit code" : "Send code first"}
                      maxLength={6}
                      className="rounded-xl text-center text-lg tracking-widest"
                      disabled={!otpSent || loading}
                    />
                    {!otpSent ? (
                      <p className="text-xs text-muted-foreground">
                        Tap &quot;Send verification code&quot; above, then enter the code
                        from your SMS here.
                      </p>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    className="w-full rounded-xl"
                    onClick={handleVerifyOtp}
                    disabled={loading || !otpSent || otp.length < 6}
                  >
                    {loading ? "Verifying…" : "Verify phone"}
                  </Button>

                  {otpSent ? (
                    <button
                      type="button"
                      className="w-full text-sm text-primary hover:underline"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp("");
                        setVerifiedPhone("");
                      }}
                    >
                      Use a different number
                    </button>
                  ) : null}
                </>
              ) : (
                <Button
                  type="button"
                  className="w-full rounded-xl"
                  onClick={handleSavePhone}
                  disabled={loading || !phone.trim()}
                >
                  {loading ? "Saving…" : "Save phone number"}
                </Button>
              )}
            </>
          )}
        </div>
      )}

      {step === "host" && (
        <form onSubmit={handleHostSubmit} className="space-y-6">
          <div className="rounded-2xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
            Tell pet owners about your home and the services you offer. You can
            update this anytime from your host dashboard.
          </div>
          <HostProfileFormFields
            form={hostForm}
            setForm={setHostForm}
            selectedServices={selectedServices}
            toggleService={toggleService}
            coverUrl={hostCoverUrl}
            galleryUrls={hostGalleryUrls}
            onPhotosChange={(cover, gallery) => {
              setHostCoverUrl(cover);
              setHostGalleryUrls(gallery);
            }}
          />
          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating host profile…
              </>
            ) : (
              "Complete host setup"
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
