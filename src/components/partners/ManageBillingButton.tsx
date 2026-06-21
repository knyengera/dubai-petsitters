"use client";

import { useState } from "react";
import { Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createPartnerBillingPortalSession } from "@/lib/partners/subscription-actions";

type Props = {
  label?: string;
  variant?: "default" | "outline";
  className?: string;
};

export default function ManageBillingButton({
  label = "Manage subscription",
  variant = "outline",
  className,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await createPartnerBillingPortalSession();
      if (result.ok === false) {
        toast({
          title: "Unable to open billing portal",
          description: result.error,
          variant: "destructive",
        });
        return;
      }
      window.location.href = result.data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      className={`rounded-xl ${className ?? ""}`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      {label}
    </Button>
  );
}
