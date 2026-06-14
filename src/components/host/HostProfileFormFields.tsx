"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import {
  HOST_SERVICE_OPTIONS,
  type HostProfileFormState,
} from "@/lib/hosting/host-profile-form";

type HostProfileFormFieldsProps = {
  form: HostProfileFormState;
  setForm: React.Dispatch<React.SetStateAction<HostProfileFormState>>;
  selectedServices: string[];
  toggleService: (id: string) => void;
  photoPreview: string | null;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function HostProfileFormFields({
  form,
  setForm,
  selectedServices,
  toggleService,
  photoPreview,
  onPhotoChange,
}: HostProfileFormFieldsProps) {
  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <div className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden bg-muted flex items-center justify-center">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
          Upload Profile Photo
          <input type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>Full Name *</Label>
          <Input
            required
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className="rounded-xl mt-1"
            placeholder="Your full name"
          />
        </div>
        <div>
          <Label>City *</Label>
          <Input
            required
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="rounded-xl mt-1"
            placeholder="e.g. Riyadh"
          />
        </div>
        <div>
          <Label>Neighborhood</Label>
          <Input
            value={form.neighborhood}
            onChange={(e) => setForm((f) => ({ ...f, neighborhood: e.target.value }))}
            className="rounded-xl mt-1"
            placeholder="e.g. Al Olaya"
          />
        </div>
      </div>

      <div>
        <Label>About You *</Label>
        <Textarea
          required
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          className="rounded-xl mt-1 min-h-[100px]"
          placeholder="Tell pet owners about yourself — your experience, home environment, and love for animals..."
        />
      </div>

      <div>
        <Label className="mb-3 block">Services You Offer *</Label>
        <div className="grid grid-cols-2 gap-3">
          {HOST_SERVICE_OPTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => toggleService(s.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                selectedServices.includes(s.id)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50"
              }`}
            >
              <s.icon className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Price per Night ({DEFAULT_CURRENCY})</Label>
          <Input
            type="number"
            value={form.price_per_night}
            onChange={(e) => setForm((f) => ({ ...f, price_per_night: e.target.value }))}
            className="rounded-xl mt-1"
            placeholder="e.g. 120"
          />
        </div>
        <div>
          <Label>Price per Day ({DEFAULT_CURRENCY})</Label>
          <Input
            type="number"
            value={form.price_per_day}
            onChange={(e) => setForm((f) => ({ ...f, price_per_day: e.target.value }))}
            className="rounded-xl mt-1"
            placeholder="e.g. 80"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Pet Types Accepted</Label>
          <Input
            value={form.accepted_pet_types}
            onChange={(e) => setForm((f) => ({ ...f, accepted_pet_types: e.target.value }))}
            className="rounded-xl mt-1"
            placeholder="dog, cat, bird..."
          />
        </div>
        <div>
          <Label>Languages Spoken</Label>
          <Input
            value={form.languages}
            onChange={(e) => setForm((f) => ({ ...f, languages: e.target.value }))}
            className="rounded-xl mt-1"
            placeholder="Arabic, English..."
          />
        </div>
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={form.has_yard}
            onChange={(e) => setForm((f) => ({ ...f, has_yard: e.target.checked }))}
            className="w-4 h-4 accent-primary"
          />
          I have a yard / garden
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={form.non_smoking}
            onChange={(e) => setForm((f) => ({ ...f, non_smoking: e.target.checked }))}
            className="w-4 h-4 accent-primary"
          />
          Non-smoking home
        </label>
      </div>
    </>
  );
}
