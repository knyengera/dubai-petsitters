"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ChatWindow({ conversation, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async () => {
    if (!conversation) return;
    const msgs = await base44.entities.Message.filter(
      { conversation_id: conversation.id },
      'created_date',
      100
    );
    setMessages(msgs);
  }, [conversation?.id]);

  useEffect(() => {
    if (!conversation) return;

    loadMessages();

    const unsub = base44.entities.Message.subscribe(() => {
      loadMessages();
    });

    base44.entities.Message.filter(
      { conversation_id: conversation.id, read: false },
      'created_date',
      100
    ).then(msgs => {
      msgs
        .filter(m => m.sender_email !== currentUser?.email)
        .forEach(m => base44.entities.Message.update(m.id, { read: true }));
    });

    return () => unsub();
  }, [conversation?.id, currentUser?.email, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending || !conversation) return;
    setSending(true);
    try {
      const msg = await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name || currentUser.email,
        content: text.trim(),
      });
      await base44.entities.Conversation.update(conversation.id, {
        last_message: text.trim().slice(0, 80),
        last_message_date: new Date().toISOString(),
      });
      setMessages(prev => [...prev, msg]);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Select a conversation to start chatting
      </div>
    );
  }

  const isOwner = currentUser?.email === conversation.owner_email;
  const otherName = isOwner ? conversation.contact_name : conversation.owner_name;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <p className="font-semibold text-foreground">{otherName}</p>
        <p className="text-xs text-muted-foreground capitalize">{conversation.contact_type} · {conversation.subject}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Say hi! 👋</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_email === currentUser?.email;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                {!isMe && <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender_name}</p>}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {msg.created_date ? format(new Date(msg.created_date), 'h:mm a') : ''}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border bg-card flex gap-2 items-end">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message… (Enter to send)"
          rows={1}
          className="flex-1 rounded-xl resize-none text-sm"
        />
        <Button onClick={handleSend} disabled={!text.trim() || sending} size="icon" className="rounded-xl shrink-0 h-10 w-10">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
