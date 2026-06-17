"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities } from "@/lib/data/entities";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StartChatButton from "@/components/messaging/StartChatButton";
import ListPetDialog from "@/components/adopt/ListPetDialog";
import { PawPrint, Loader2, Plus, Inbox } from "lucide-react";

type Row = Record<string, unknown>;

const STATUS_VARIANTS: Record<string, string> = {
  available: "bg-success/10 text-success",
  pending_review: "bg-warning/10 text-warning",
  pending: "bg-info/10 text-info",
  adopted: "bg-muted text-muted-foreground",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${STATUS_VARIANTS[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export default function MyAdoptions() {
  const { user } = useAuth();
  const [showListDialog, setShowListDialog] = useState(false);

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["my-adoption-listings", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const pets = await entities.Pet.filter({ created_by: user!.email }, "-created_date");
      const requestsByPet = await Promise.all(
        pets.map((p) => entities.AdoptionRequest.filter({ pet_id: p.id as string }, "-created_date"))
      );
      return pets.map((pet, i) => ({ pet, requests: requestsByPet[i] as Row[] }));
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-end mb-6">
          <Button onClick={() => setShowListDialog(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> List a Pet
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl">
            <PawPrint className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-4">List a pet to find it a loving home.</p>
            <Button onClick={() => setShowListDialog(true)} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> List a Pet for Adoption
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {data.map(({ pet, requests }) => (
              <div key={String(pet.id)} className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="flex items-center gap-4 p-4 border-b border-border">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {pet.image_url ? (
                      <img src={String(pet.image_url)} alt={String(pet.name)} className="w-full h-full object-cover" />
                    ) : (
                      <PawPrint className="w-7 h-7 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{String(pet.name)}</p>
                      <StatusBadge status={String(pet.status ?? "available")} />
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">
                      {String(pet.species ?? "")}{pet.breed ? ` · ${String(pet.breed)}` : ""}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {requests.length} {requests.length === 1 ? "request" : "requests"}
                  </span>
                </div>

                {requests.length === 0 ? (
                  <div className="flex items-center gap-2 px-4 py-5 text-sm text-muted-foreground">
                    <Inbox className="w-4 h-4" /> No adoption requests yet.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {requests.map((req) => (
                      <div key={String(req.id)} className="flex items-center gap-3 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground text-sm truncate">
                              {String(req.applicant_name ?? "Applicant")}
                            </p>
                            <StatusBadge status={String(req.status ?? "pending")} />
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {String(req.applicant_email ?? "")}
                          </p>
                          {req.message ? (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              &ldquo;{String(req.message)}&rdquo;
                            </p>
                          ) : null}
                        </div>
                        <StartChatButton
                          contactId={String(req.id)}
                          contactName={String(req.applicant_name ?? "Applicant")}
                          contactType="adoption"
                          contactEmail={String(req.applicant_email ?? "")}
                          subject={`Adoption inquiry for ${String(pet.name)}`}
                          size="sm"
                        >
                          Message
                        </StartChatButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ListPetDialog
        open={showListDialog}
        onClose={() => setShowListDialog(false)}
        onCreated={refetch}
      />
    </div>
  );
}
