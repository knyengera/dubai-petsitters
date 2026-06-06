"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/lib/data";
import type { AuthUser } from "@/lib/data/auth-api";

type AdminGuardProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      fallback ?? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Access restricted to admins only.</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}
