"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { hostsQueries } from "@/features/hosts/queries";

export type HostProfile = Awaited<ReturnType<typeof hostsQueries.forUser>>;

export function useHostProfile() {
  const { user, isLoadingAuth } = useAuth();

  const { data: hostProfile = null, isLoading: isLoadingHost } = useQuery({
    queryKey: ["host-profile", user?.id],
    queryFn: () => {
      if (!user) return null;
      return hostsQueries.forUser({ id: user.id, email: user.email! });
    },
    enabled: !!user && !isLoadingAuth,
  });

  return {
    hostProfile,
    isHost: !!hostProfile,
    isLoading: isLoadingAuth || (!!user && isLoadingHost),
  };
}
