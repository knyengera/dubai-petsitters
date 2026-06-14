"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/lib/data/entities";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PawPrint } from "lucide-react";

const ALL_PET_TYPES = ["dog", "cat", "bird", "rabbit", "fish", "reptile", "other"];
const NEW_PET_VALUE = "__new__";

export type BookingPetValue = {
  mode: "saved" | "new";
  petId?: string;
  petName: string;
  petType: string;
};

type BookingPetFieldProps = {
  acceptedPetTypes: string[];
  value: BookingPetValue;
  onChange: (value: BookingPetValue) => void;
  disabled?: boolean;
};

function resolvePetTypes(acceptedPetTypes: string[]): string[] {
  return acceptedPetTypes.length > 0 ? acceptedPetTypes : ALL_PET_TYPES;
}

export default function BookingPetField({
  acceptedPetTypes,
  value,
  onChange,
  disabled = false,
}: BookingPetFieldProps) {
  const { user } = useAuth();
  const petTypes = useMemo(() => resolvePetTypes(acceptedPetTypes), [acceptedPetTypes]);
  const normalizedTypes = useMemo(() => petTypes.map((t) => t.toLowerCase()), [petTypes]);

  const { data: allPets = [] } = useQuery({
    queryKey: ["my-pets"],
    queryFn: () => entities.UserPet.list("-created_date", 50),
    enabled: !!user?.email,
    initialData: [],
  });

  const eligiblePets = useMemo(
    () =>
      allPets.filter((pet) =>
        normalizedTypes.includes(String(pet.species || "").toLowerCase())
      ),
    [allPets, normalizedTypes]
  );

  useEffect(() => {
    if (value.mode !== "new" || value.petType || petTypes.length !== 1) return;
    onChange({ ...value, petType: petTypes[0] });
  }, [value.mode, value.petType, value.petName, value.petId, petTypes, onChange]);

  const selectValue =
    value.mode === "saved" && value.petId ? value.petId : NEW_PET_VALUE;

  const handlePetSelect = (selected: string) => {
    if (selected === NEW_PET_VALUE) {
      onChange({
        mode: "new",
        petId: undefined,
        petName: value.petName,
        petType: petTypes.length === 1 ? petTypes[0] : value.petType,
      });
      return;
    }

    const pet = eligiblePets.find((p) => String(p.id) === selected);
    if (!pet) return;
    onChange({
      mode: "saved",
      petId: String(pet.id),
      petName: String(pet.name || ""),
      petType: String(pet.species || ""),
    });
  };

  if (!user) {
    return (
      <div className="space-y-2">
        <Label className="text-xs">Pet *</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              required
              disabled={disabled}
              value={value.petName}
              onChange={(e) =>
                onChange({ ...value, mode: "new", petId: undefined, petName: e.target.value })
              }
              className="rounded-xl mt-1 h-10 text-sm"
              placeholder="Pet name"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={value.petType}
              onValueChange={(petType) =>
                onChange({ ...value, mode: "new", petId: undefined, petType })
              }
              disabled={disabled}
            >
              <SelectTrigger className="rounded-xl mt-1 h-10 text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {petTypes.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Pet *</Label>
      <Select value={selectValue} onValueChange={handlePetSelect} disabled={disabled}>
        <SelectTrigger className="rounded-xl h-10 text-sm">
          <SelectValue placeholder="Select a pet" />
        </SelectTrigger>
        <SelectContent>
          {eligiblePets.map((pet) => (
            <SelectItem key={String(pet.id)} value={String(pet.id)}>
              {String(pet.name)} ({String(pet.species)})
            </SelectItem>
          ))}
          <SelectItem value={NEW_PET_VALUE}>Enter new pet</SelectItem>
        </SelectContent>
      </Select>

      {value.mode === "saved" && value.petId && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm">
          <PawPrint className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium capitalize">
            {value.petName} · {value.petType}
          </span>
        </div>
      )}

      {value.mode === "new" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input
              required
              disabled={disabled}
              value={value.petName}
              onChange={(e) => onChange({ ...value, petName: e.target.value })}
              className="rounded-xl mt-1 h-10 text-sm"
              placeholder="Pet name"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Select
              value={value.petType}
              onValueChange={(petType) => onChange({ ...value, petType })}
              disabled={disabled}
            >
              <SelectTrigger className="rounded-xl mt-1 h-10 text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {petTypes.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

export function isBookingPetValid(pet: BookingPetValue): boolean {
  if (pet.mode === "saved") {
    return !!pet.petId && !!pet.petName && !!pet.petType;
  }
  return !!pet.petName.trim() && !!pet.petType;
}
