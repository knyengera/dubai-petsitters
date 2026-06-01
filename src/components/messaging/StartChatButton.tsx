"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { base44 } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';

export default function StartChatButton({ contactId, contactName, contactType, subject, className }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = async () => {
    setLoading(true);
    const user = await base44.auth.me();
    if (!user) { base44.auth.redirectToLogin(); return; }

    // Find existing conversation or create new one
    const existing = await base44.entities.Conversation.filter({
      owner_email: user.email,
      contact_id: contactId,
    });

    let conv;
    if (existing.length > 0) {
      conv = existing[0];
    } else {
      conv = await base44.entities.Conversation.create({
        owner_email: user.email,
        owner_name: user.full_name || user.email,
        contact_id: contactId,
        contact_name: contactName,
        contact_type: contactType,
        subject: subject || `Question about ${contactName}`,
      });
    }
    setLoading(false);
    router.push(`/messages?id=${conv.id}`);
  };

  return (
    <Button onClick={handleClick} disabled={loading} variant="outline" className={`rounded-xl gap-2 ${className || ''}`}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
      Message
    </Button>
  );
}