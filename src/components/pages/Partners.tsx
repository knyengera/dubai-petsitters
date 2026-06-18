"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { entities } from "@/lib/data/entities";
import { useQuery } from "@tanstack/react-query";
import PartnerCard, { type PartnerCardModel } from "@/components/partners/PartnerCard";
import PartnerFilters, {
  DEFAULT_PARTNER_FILTERS,
  applyPartnerFilters,
} from "@/components/filters/PartnerFilters";
import { isNonVetPartner } from "@/lib/partners/queries";
import { Store, Loader2, Megaphone } from "lucide-react";

export default function Partners() {
  const [filters, setFilters] = useState(DEFAULT_PARTNER_FILTERS);

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["partner-businesses"],
    queryFn: async () => {
      const rows = await entities.VetClinic.filter({ is_approved: true }, "-rating");
      return (rows as PartnerCardModel[]).filter(isNonVetPartner);
    },
  });

  const filtered = useMemo(
    () => applyPartnerFilters(partners, filters),
    [partners, filters]
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/become-partner" className="inline-block mb-6">
          <Button className="rounded-xl gap-2 font-semibold">
            <Megaphone className="w-4 h-4" /> Become a Partner
          </Button>
        </Link>
        <PartnerFilters filters={filters} onChange={setFilters} />
        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-6">
            {filtered.length} partner{filtered.length !== 1 ? "s" : ""} found
          </p>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No partners found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((partner, i) => (
              <div key={partner.id}>
                <PartnerCard partner={partner} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
