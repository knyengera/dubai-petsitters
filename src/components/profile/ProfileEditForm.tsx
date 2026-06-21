"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, ShieldCheck, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  getProfile,
  saveProfileDetails,
  type ProfileDetailsInput,
} from "@/lib/profile/actions";
import { getSignupAccountType } from "@/lib/auth/onboarding";
import { uploadAppFile } from "@/lib/storage/upload";
import IdentityReverifyPanel from "@/components/profile/IdentityReverifyPanel";

export default function ProfileEditForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isLoadingAuth } = useAuth();

  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);
  const [reverifying, setReverifying] = useState(false);

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
  const [idCaptured, setIdCaptured] = useState({
    dob: false,
    gender: false,
    idType: false,
    idNumber: false,
  });

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
        setIsHost(getSignupAccountType(profile) === "host");
        setIdentityVerified(profile.id_verification_status === "verified");
        setIdCaptured({
          dob: !!profile.date_of_birth,
          gender: !!profile.gender,
          idType: !!profile.id_type,
          idNumber: !!profile.id_number?.trim(),
        });
      }
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && !user) {
      router.replace(`/login?next=${encodeURIComponent("/profile/edit")}`);
      return;
    }
    if (user) loadProfile();
  }, [user, isLoadingAuth, router, loadProfile]);

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

  const handleReverified = useCallback(async () => {
    await loadProfile();
    setReverifying(false);
    toast({ title: "Identity re-verified — details updated" });
  }, [loadProfile, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!avatarFile && !form.avatar_url.trim()) {
      toast({ title: "Profile photo is required.", variant: "destructive" });
      return;
    }
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

      setForm((f) => ({ ...f, avatar_url: avatarUrl, id_document_path: idDocumentPath }));
      setAvatarFile(null);
      setIdDocFile(null);
      toast({ title: "Profile updated" });
      router.push("/settings");
    } catch (err) {
      toast({
        title: err instanceof Error ? err.message : "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingAuth || !user || !loaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Verified hosts can't hand-edit details captured from their ID. Only the
  // fields Stripe actually returned are locked; the rest stay editable.
  const isHostVerifiedKyc = isHost && identityVerified;
  const lockDob = isHostVerifiedKyc && idCaptured.dob;
  const lockGender = isHostVerifiedKyc && idCaptured.gender;
  const lockIdType = isHostVerifiedKyc && idCaptured.idType;
  const lockIdNumber = isHostVerifiedKyc && idCaptured.idNumber;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to settings
          </Link>
          <p className="font-heading text-2xl font-bold text-foreground mt-2">
            Edit profile
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Update your photo and personal details
          </p>
        </motion.div>

        <div>
          <h2 className="font-heading text-lg font-bold text-foreground mb-4">
            Profile details
          </h2>
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    Change profile photo
                  </Label>
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
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
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>
                        Your date of birth, gender, and ID details come from your
                        verified ID and can&apos;t be edited directly. To change
                        them, re-verify your identity.
                      </span>
                    </div>
                    {!reverifying && (
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl select-none min-h-[44px]"
                        onClick={() => setReverifying(true)}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" />
                        Re-verify ID to change these
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="id_doc">ID document (photo or PDF) *</Label>
                    <Input
                      id="id_doc"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleIdDocChange}
                      className="rounded-xl"
                    />
                    {(idDocFile || form.id_document_path) && (
                      <p className="text-xs text-muted-foreground">
                        {idDocFile?.name ?? "Document on file"}
                      </p>
                    )}
                  </div>
                )}

                {reverifying ? (
                  <IdentityReverifyPanel
                    userId={user.id}
                    onVerified={handleReverified}
                    onCancel={() => setReverifying(false)}
                  />
                ) : (
                  <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
