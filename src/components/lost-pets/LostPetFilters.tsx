"use client";

import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/lib/language-context";

export type LostPetFiltersState = {
  search: string;
  status: string;
  species: string;
};

type LostPetFiltersProps = {
  filters: LostPetFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<LostPetFiltersState>>;
  onReport: () => void;
};

const statusItems = {
  all: "All statuses",
  lost: "Lost",
  found: "Found",
  reunited: "Reunited",
};

const speciesItems = {
  all: "All species",
  dog: "Dogs",
  cat: "Cats",
  bird: "Birds",
  rabbit: "Rabbits",
  other: "Other",
};

export default function LostPetFilters({
  filters,
  setFilters,
  onReport,
}: LostPetFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("Search by name, city...", "ابحث بالاسم أو المدينة...")}
          value={filters.search}
          onChange={(e) =>
            setFilters((f) => ({ ...f, search: e.target.value }))
          }
          className="ps-10 rounded-xl"
        />
      </div>

      <Select
        items={statusItems}
        value={filters.status}
        onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
      >
        <SelectTrigger className="h-11 w-full rounded-xl">
          <SelectValue placeholder={t("All statuses", "كل الحالات")} />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} side="top" sideOffset={8}>
          <SelectItem value="all">{t("All statuses", "كل الحالات")}</SelectItem>
          <SelectItem value="lost">{t("Lost", "ضائع")}</SelectItem>
          <SelectItem value="found">{t("Found", "معثور")}</SelectItem>
          <SelectItem value="reunited">{t("Reunited", "عاد")}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        items={speciesItems}
        value={filters.species}
        onValueChange={(v) => setFilters((f) => ({ ...f, species: v }))}
      >
        <SelectTrigger className="h-11 w-full rounded-xl">
          <SelectValue placeholder={t("All species", "كل الأنواع")} />
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} side="top" sideOffset={8}>
          <SelectItem value="all">{t("All species", "كل الأنواع")}</SelectItem>
          <SelectItem value="dog">{t("Dogs", "كلاب")}</SelectItem>
          <SelectItem value="cat">{t("Cats", "قطط")}</SelectItem>
          <SelectItem value="bird">{t("Birds", "طيور")}</SelectItem>
          <SelectItem value="rabbit">{t("Rabbits", "أرانب")}</SelectItem>
          <SelectItem value="other">{t("Other", "أخرى")}</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={onReport} className="w-full rounded-xl gap-2">
        <Plus className="w-4 h-4" />
        {t("File Report", "تقديم بلاغ")}
      </Button>
    </div>
  );
}
