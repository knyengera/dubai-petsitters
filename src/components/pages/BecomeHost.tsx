"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { entities } from "@/lib/data/entities";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/auth-context";
import { uploadAppFile } from "@/lib/storage/upload";
import { useHostProfile } from "@/lib/hosting/use-host-profile";
import HostProfileFormFields from "@/components/host/HostProfileFormFields";
import { emptyHostProfileForm, hostFormToPayload } from "@/lib/hosting/host-profile-form";
import Link from "next/link";
import {
  CheckCircle,
  Star,
  Users,
  DollarSign,
  Shield,
  Loader2,
  CalendarDays,
} from "lucide-react";

const perks = [
  { icon: DollarSign, title: "Earn Extra Income", desc: "Set your own rates and earn on your schedule." },
  { icon: Users, title: "Meet Fellow Pet Lovers", desc: "Join a community of passionate animal caregivers." },
  { icon: Shield, title: "Full Insurance Coverage", desc: "Every booking is protected by our care guarantee." },
  { icon: Star, title: "Build Your Reputation", desc: "Collect reviews and grow your hosting profile." },
];

export default function BecomeHost() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isHost, isLoading: isLoadingHost } = useHostProfile();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [form, setForm] = useState(emptyHostProfileForm());

  useEffect(() => {
    if (!isLoadingHost && isHost) {
      router.replace("/dashboard");
    }
  }, [isHost, isLoadingHost, router]);

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
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to submit a host application.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      let photo_url: string | null = null;
      if (photoFile) {
        photo_url = await uploadAppFile("public-uploads", photoFile, user.id, "hosts", "profile");
      }
      const payload = hostFormToPayload(form, selectedServices, photo_url);
      await entities.PetHost.create({
        ...payload,
        is_available: true,
        created_by: user.email,
        user_id: user.id,
      });
      toast({ title: "Application submitted!" });
      setSubmitted(true);
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Could not submit application",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingHost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-heading text-3xl font-bold text-foreground mb-3">You are on your way!</h2>
          <p className="text-muted-foreground mb-6">
            Your host profile has been submitted. Block any dates you are unavailable so guests only see
            open days when booking.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/dashboard">
              <Button className="rounded-xl bg-primary gap-2 w-full sm:w-auto">
                <CalendarDays className="w-4 h-4" />
                Go to Host Dashboard
              </Button>
            </Link>
            <Link href="/host-calendar">
              <Button variant="outline" className="rounded-xl w-full sm:w-auto">
                Set Your Availability
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {perks.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="bg-card border border-border rounded-2xl p-5 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <p.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading font-bold text-foreground text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2 text-center">
            Create Your Host Profile
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Fill in your details below and start accepting bookings.
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary h-12 font-bold text-base"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Submit My Host Profile
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
