"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useHostProfile } from "@/lib/hosting/use-host-profile";
import { getHostBalance } from "@/lib/monetisation/actions";
import { getHostPayoutSettings } from "@/lib/hosting/payout-settings";
import HostPayoutMethodForm from "@/components/host/HostPayoutMethodForm";
import HostEarningsPanel from "@/components/host/HostEarningsPanel";

export default function HostEarnings() {
  const router = useRouter();
  const { hostProfile, isHost, isLoading } = useHostProfile();
  const hostId = hostProfile?.id as string | undefined;

  useEffect(() => {
    if (isLoading) return;
    if (!isHost || !hostProfile) {
      router.replace("/become-host");
    }
  }, [hostProfile, isHost, isLoading, router]);

  const {
    data: hostBalance,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ["host-balance", hostId],
    queryFn: async () => {
      const result = await getHostBalance(hostId!);
      return result.ok ? result.data : null;
    },
    enabled: !!hostId,
  });

  const {
    data: payoutSettings,
    refetch: refetchPayoutSettings,
  } = useQuery({
    queryKey: ["host-payout-settings", hostId],
    queryFn: async () => {
      const result = await getHostPayoutSettings(hostId!);
      return result.ok ? result.data : null;
    },
    enabled: !!hostId,
  });

  if (isLoading || !hostProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <div className="text-center mb-2">
          <h2 className="font-heading text-2xl font-bold text-foreground">Earnings & Payouts</h2>
          <p className="text-muted-foreground mt-1">
            View your balance, set how you get paid, and request withdrawals.
          </p>
        </div>

        <HostPayoutMethodForm
          hostId={hostId!}
          settings={payoutSettings ?? null}
          onSaved={() => refetchPayoutSettings()}
        />

        <HostEarningsPanel
          hostId={hostId!}
          balance={hostBalance ?? null}
          payoutSettings={payoutSettings ?? null}
          onUpdated={() => refetchBalance()}
        />
      </div>
    </div>
  );
}
