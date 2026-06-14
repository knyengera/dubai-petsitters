"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { entities } from "@/lib/data/entities";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { uploadAppFile } from "@/lib/storage/upload";
import { useHostProfile } from "@/lib/hosting/use-host-profile";
import HostProfileFormFields from "@/components/host/HostProfileFormFields";
import {
  emptyHostProfileForm,
  hostFormToPayload,
  hostRecordToForm,
  servicesFromRecord,
} from "@/lib/hosting/host-profile-form";
import { Loader2 } from "lucide-react";

export default function EditHostProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { hostProfile, isHost, isLoading } = useHostProfile();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [form, setForm] = useState(emptyHostProfileForm());

  useEffect(() => {
    if (isLoading) return;
    if (!isHost || !hostProfile) {
      router.replace("/become-host");
      return;
    }
    setForm(hostRecordToForm(hostProfile as Record<string, unknown>));
    setSelectedServices(servicesFromRecord(hostProfile as Record<string, unknown>));
    if (hostProfile.photo_url) {
      setPhotoPreview(hostProfile.photo_url as string);
    }
  }, [hostProfile, isHost, isLoading, router]);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      toast({ title: "Please select at least one service", variant: "destructive" });
      return;
    }
    if (!user || !hostProfile) return;

    setLoading(true);
    try {
      let photo_url = (hostProfile.photo_url as string | null) ?? null;
      if (photoFile) {
        photo_url = await uploadAppFile("public-uploads", photoFile, user.id, "hosts", "profile");
      }
      const payload = hostFormToPayload(form, selectedServices, photo_url);
      await entities.PetHost.update(hostProfile.id as string, payload);
      await queryClient.invalidateQueries({ queryKey: ["host-profile"] });
      toast({ title: "Listing updated" });
      router.push("/dashboard");
    } catch (err) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update listing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !hostProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-heading text-2xl font-bold text-foreground mb-2 text-center">
          Edit Your Host Listing
        </h2>
        <p className="text-muted-foreground text-center mb-8">
          Update your profile, services, and pricing.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <HostProfileFormFields
            form={form}
            setForm={setForm}
            selectedServices={selectedServices}
            toggleService={toggleService}
            photoPreview={photoPreview}
            onPhotoChange={handlePhotoChange}
          />

          <Button type="submit" disabled={loading} className="w-full rounded-xl bg-primary h-12 font-bold text-base">
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
}
