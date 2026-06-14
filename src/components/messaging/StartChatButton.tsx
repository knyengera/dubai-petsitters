"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { base44 } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { MessageCircle, Loader2 } from "lucide-react";
import {
  findOrCreateConversation,
  type ContactType,
} from "@/lib/messaging/conversations";

type StartChatButtonProps = {
  contactId: string;
  contactName: string;
  contactType: ContactType;
  subject?: string;
  contactEmail?: string | null;
  className?: string;
  stopPropagation?: boolean;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  children?: React.ReactNode;
};

export default function StartChatButton({
  contactId,
  contactName,
  contactType,
  subject,
  contactEmail,
  className,
  stopPropagation = false,
  variant = "outline",
  size = "default",
  children,
}: StartChatButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    setLoading(true);
    try {
      const user = await base44.auth.me();
      if (!user) {
        base44.auth.redirectToLogin();
        return;
      }

      const conv = await findOrCreateConversation({
        user,
        contactId,
        contactName,
        contactType,
        subject,
        contactEmail,
      });

      router.push(`/messages?id=${conv.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={variant}
      size={size}
      className={`rounded-xl gap-2 ${className || ""}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      {children ?? "Message"}
    </Button>
  );
}
