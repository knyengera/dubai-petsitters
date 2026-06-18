"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ImageUpload from "@/components/common/ImageUpload";
import { entities } from "@/lib/data/entities";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, PawPrint } from "lucide-react";

const SPECIES = ["dog", "cat", "bird", "rabbit", "fish", "reptile", "other"];

const EMPTY = {
  name: "",
  species: "dog",
  breed: "",
  age: "",
  gender: "male",
  size: "medium",
  description: "",
  image_url: "",
  location: "",
  vaccinated: false,
  neutered: false,
  poster_name: "",
  poster_email: "",
  poster_phone: "",
};

export default function ListPetDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setForm((f) => ({
      ...f,
      poster_name:
        f.poster_name ||
        (user.user_metadata?.full_name as string | undefined) ||
        "",
      poster_email: f.poster_email || user.email || "",
      poster_phone: f.poster_phone || user.phone || "",
    }));
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await entities.Pet.create({
        ...form,
        created_by: user?.email,
        status: "pending_review",
      });
      toast({
        title: "Listing submitted for review",
        description: `${form.name} will appear in adoptions once an admin approves it.`,
      });
      setForm(EMPTY);
      onCreated?.();
      onClose();
    } catch (err) {
      toast({
        title: "Could not submit listing",
        description: (err as Error)?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-primary" /> List a Pet for Adoption
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="flex justify-center">
            <ImageUpload
              value={form.image_url}
              onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
              category="pets"
              label="Pet Photo"
              variant="square"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Name *</Label>
              <Input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Species</Label>
              <Select value={form.species} onValueChange={(v) => setForm((f) => ({ ...f, species: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SPECIES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Breed</Label>
              <Input value={form.breed} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Age</Label>
              <Input value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} className="rounded-xl mt-1" placeholder="e.g. 2 years" />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm((f) => ({ ...f, gender: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["male", "female"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Size</Label>
              <Select value={form.size} onValueChange={(v) => setForm((f) => ({ ...f, size: v }))}>
                <SelectTrigger className="rounded-xl mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["small", "medium", "large"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="rounded-xl mt-1" placeholder="Tell adopters about this pet's personality and needs..." />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox checked={form.vaccinated} onCheckedChange={(v) => setForm((f) => ({ ...f, vaccinated: Boolean(v) }))} />
              <Label>Vaccinated</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.neutered} onCheckedChange={(v) => setForm((f) => ({ ...f, neutered: Boolean(v) }))} />
              <Label>Neutered</Label>
            </div>
          </div>
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Your contact details</p>
            <p className="text-xs text-muted-foreground">
              Shown to adopters so they can reach you directly.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Name</Label>
                <Input value={form.poster_name} onChange={(e) => setForm((f) => ({ ...f, poster_name: e.target.value }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.poster_email} onChange={(e) => setForm((f) => ({ ...f, poster_email: e.target.value }))} className="rounded-xl mt-1" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.poster_phone} onChange={(e) => setForm((f) => ({ ...f, poster_phone: e.target.value }))} className="rounded-xl mt-1" />
              </div>
            </div>
          </div>
          <Button type="submit" disabled={saving} className="w-full rounded-xl bg-primary hover:bg-primary/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Listing"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
