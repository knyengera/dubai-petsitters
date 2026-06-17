"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useHostProfile } from "@/lib/hosting/use-host-profile";
import OwnerDashboard from "@/components/dashboard/OwnerDashboard";
import HostDashboard from "@/components/dashboard/HostDashboard";

export default function Dashboard() {
  const { hostProfile, isHost, isLoading } = useHostProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-8">
        {isHost && hostProfile ? (
          <HostDashboard hostProfile={hostProfile} />
        ) : (
          <OwnerDashboard />
        )}
      </div>
    </div>
  );
}
