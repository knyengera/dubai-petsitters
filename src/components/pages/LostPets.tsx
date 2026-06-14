"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities } from "@/lib/data/entities";
import { useLanguage } from "@/lib/language-context";
import { MapPin, Plus, X, AlertTriangle, Loader2 } from "lucide-react";
import ImageUpload from "@/components/common/ImageUpload";
import LostPetFilters, {
  type LostPetFiltersState,
} from "@/components/lost-pets/LostPetFilters";
import LostPetCard from "@/components/lost-pets/LostPetCard";
import PullToRefresh from "@/components/common/PullToRefresh";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

const emptyForm = {
  pet_name: "",
  species: "dog",
  breed: "",
  color: "",
  gender: "unknown",
  age: "",
  photo_url: "",
  last_seen_location: "",
  last_seen_date: "",
  city: "",
  description: "",
  owner_name: "",
  owner_phone: "",
  owner_email: "",
  reward_offered: "",
};

export default function LostPets() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<LostPetFiltersState>({
    search: "",
    status: "all",
    species: "all",
  });

  const { data: pets = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["lost-pets"],
    queryFn: () => entities.LostPet.list("-created_date", 100),
  });

  const filtered = useMemo(() => {
    return pets.filter((p) => {
      const search = filters.search.trim().toLowerCase();
      const matchSearch =
        !search ||
        p.pet_name?.toLowerCase().includes(search) ||
        p.city?.toLowerCase().includes(search) ||
        p.last_seen_location?.toLowerCase().includes(search);
      const matchStatus =
        filters.status === "all" || p.status === filters.status;
      const matchSpecies =
        filters.species === "all" || p.species === filters.species;
      return matchSearch && matchStatus && matchSpecies;
    });
  }, [pets, filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await entities.LostPet.create(form);
      toast({ title: t("Report submitted!", "تم إرسال البلاغ!") });
      qc.invalidateQueries({ queryKey: ["lost-pets"] });
      setForm(emptyForm);
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PullToRefresh onRefresh={refetch}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <LostPetFilters
                filters={filters}
                setFilters={setFilters}
                onReport={() => setShowForm(true)}
              />
            </div>

            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : isError ? (
                <div className="text-center py-20">
                  <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("Failed to load reports", "تعذر تحميل البلاغات")}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {error instanceof Error
                      ? error.message
                      : t("Please try again.", "يرجى المحاولة مرة أخرى.")}
                  </p>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => refetch()}
                  >
                    {t("Try again", "حاول مرة أخرى")}
                  </Button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {t("No reports found", "لا توجد بلاغات")}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t(
                      "Try adjusting your filters or file a new report.",
                      "جرّب تعديل الفلاتر أو قدّم بلاغاً جديداً."
                    )}
                  </p>
                  <Button
                    onClick={() => setShowForm(true)}
                    className="rounded-xl gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t("File Report", "تقديم بلاغ")}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.map((pet, i) => (
                    <motion.div
                      key={pet.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <LostPetCard pet={pet} />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </PullToRefresh>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="relative bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl font-bold text-foreground">
                  {t("Report Lost Pet", "الإبلاغ عن حيوان ضائع")}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-center">
                  <ImageUpload
                    value={form.photo_url}
                    onChange={(url) =>
                      setForm((f) => ({ ...f, photo_url: url }))
                    }
                    category="lost-pets"
                    label="Upload Pet Photo"
                    variant="square"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{t("Pet Name", "اسم الحيوان")} *</Label>
                    <Input
                      required
                      value={form.pet_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, pet_name: e.target.value }))
                      }
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t("Species", "النوع")}</Label>
                    <Select
                      value={form.species}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, species: v }))
                      }
                    >
                      <SelectTrigger className="rounded-xl mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["dog", "cat", "bird", "rabbit", "other"].map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t("Breed", "السلالة")}</Label>
                    <Input
                      value={form.breed}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, breed: e.target.value }))
                      }
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t("Color", "اللون")}</Label>
                    <Input
                      value={form.color}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, color: e.target.value }))
                      }
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>
                      {t("Last Seen Location", "آخر مكان شوهد فيه")} *
                    </Label>
                    <Input
                      required
                      value={form.last_seen_location}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          last_seen_location: e.target.value,
                        }))
                      }
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t("City", "المدينة")}</Label>
                    <Input
                      value={form.city}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, city: e.target.value }))
                      }
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t("Date Lost", "تاريخ الضياع")}</Label>
                    <Input
                      type="date"
                      value={form.last_seen_date}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          last_seen_date: e.target.value,
                        }))
                      }
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t(`Reward (${DEFAULT_CURRENCY})`, "مكافأة (دولار)")}</Label>
                    <Input
                      value={form.reward_offered}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          reward_offered: e.target.value,
                        }))
                      }
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t("Your Name", "اسمك")} *</Label>
                    <Input
                      required
                      value={form.owner_name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, owner_name: e.target.value }))
                      }
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <div>
                    <Label>{t("Phone", "الهاتف")} *</Label>
                    <Input
                      required
                      value={form.owner_phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, owner_phone: e.target.value }))
                      }
                      className="rounded-xl mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label>{t("Description", "الوصف")}</Label>
                  <Input
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="rounded-xl mt-1"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl h-12 font-bold"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin me-2" />
                  ) : null}
                  {t("Submit Report", "إرسال البلاغ")}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
