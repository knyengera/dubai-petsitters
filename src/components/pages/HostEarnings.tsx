"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { useHostProfile } from "@/lib/hosting/use-host-profile";
import { getHostBalance } from "@/lib/monetisation/actions";
import { getHostPayoutSettings } from "@/lib/hosting/payout-settings";
import HostPayoutMethodForm from "@/components/host/HostPayoutMethodForm";
import HostEarningsPanel from "@/components/host/HostEarningsPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HostEarnings() {
  const router = useRouter();
  const { hostProfile, isHost, isLoading } = useHostProfile();
  const hostId = hostProfile?.id as string | undefined;
  const [activeTab, setActiveTab] = useState("earnings");

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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-0">
            <div className="border-b border-border px-4 sm:px-6 pt-4 pb-0">
              <TabsList className="w-full sm:w-auto rounded-xl h-auto p-1">
                <TabsTrigger value="earnings" className="rounded-lg flex-1 sm:flex-none gap-2 px-4 py-2">
                  <Wallet className="w-4 h-4" />
                  Earnings
                </TabsTrigger>
                <TabsTrigger value="payout-method" className="rounded-lg flex-1 sm:flex-none gap-2 px-4 py-2">
                  <CreditCard className="w-4 h-4" />
                  Payout method
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="earnings" className="p-4 sm:p-6 mt-0">
              <HostEarningsPanel
                hostId={hostId!}
                balance={hostBalance ?? null}
                payoutSettings={payoutSettings ?? null}
                embedded
                onSetupPayoutMethod={() => setActiveTab("payout-method")}
                onUpdated={() => refetchBalance()}
              />
            </TabsContent>

            <TabsContent value="payout-method" className="p-4 sm:p-6 mt-0">
              <HostPayoutMethodForm
                hostId={hostId!}
                settings={payoutSettings ?? null}
                embedded
                onSaved={() => refetchPayoutSettings()}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
