"use client";

import { base44 } from "@/lib/data";

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { MessageCircle, Loader2, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import ChatWindow from '@/components/messaging/ChatWindow';

export default function Messages() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showList, setShowList] = useState(true);

  // Parse ?id= from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) { setSelectedId(id); setShowList(false); }
  }, []);

  useEffect(() => {
    base44.auth.me().then(u => {
      setCurrentUser(u);
      if (!u) { base44.auth.redirectToLogin(); return; }
      loadConversations(u);
    });
  }, []);

  const loadConversations = async (user) => {
    const [asOwner, asContact] = await Promise.all([
      entities.Conversation.filter({ owner_email: user.email }, '-last_message_date', 50),
      entities.Conversation.filter({ contact_email: user.email }, '-last_message_date', 50),
    ]);
    const merged = [...asOwner, ...asContact].sort((a, b) =>
      new Date(b.last_message_date || b.created_date) - new Date(a.last_message_date || a.created_date)
    );
    setConversations(merged);
  };

  // Real-time subscription for conversations
  useEffect(() => {
    const unsub = entities.Conversation.subscribe(() => {
      if (currentUser) loadConversations(currentUser);
    });
    return () => unsub();
  }, [currentUser]);

  const selectedConv = conversations.find(c => c.id === selectedId) || null;

  const selectConv = (conv) => {
    setSelectedId(conv.id);
    setShowList(false);
    window.history.replaceState(null, '', `/messages?id=${conv.id}`);
  };

  const unreadCount = (conv) => {
    if (!currentUser) return 0;
    return currentUser.email === conv.owner_email ? conv.owner_unread || 0 : conv.contact_unread || 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-7 h-7 text-primary" />
          <h1 className="font-heading text-2xl font-bold text-foreground">Messages</h1>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: 480 }}>
          <div className="flex h-full">
            {/* Conversation list */}
            <div className={`w-full md:w-80 border-r border-border flex flex-col shrink-0 ${!showList ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-border">
                <p className="font-semibold text-sm text-foreground">Conversations</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {conversations.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <MessageCircle className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No conversations yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Message a host or vet to get started.</p>
                  </div>
                )}
                {conversations.map(conv => {
                  const isSelected = conv.id === selectedId;
                  const unread = unreadCount(conv);
                  const isOwner = currentUser?.email === conv.owner_email;
                  const otherName = isOwner ? conv.contact_name : conv.owner_name;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => selectConv(conv)}
                      className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors ${isSelected ? 'bg-primary/10 border-r-2 border-primary' : 'hover:bg-muted'}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-primary font-bold text-sm">{otherName?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-sm text-foreground truncate">{otherName}</p>
                          {unread > 0 && <Badge className="text-xs px-1.5 py-0 min-h-0 h-5">{unread}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize mb-0.5">{conv.contact_type}</p>
                        <p className="text-xs text-muted-foreground truncate">{conv.last_message || 'No messages yet'}</p>
                        {conv.last_message_date && (
                          <p className="text-xs text-muted-foreground/60 mt-0.5">
                            {format(new Date(conv.last_message_date), 'MMM d, h:mm a')}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat area */}
            <div className={`flex-1 flex flex-col ${showList ? 'hidden md:flex' : 'flex'}`}>
              {/* Mobile back button */}
              <div className="md:hidden p-2 border-b border-border">
                <button onClick={() => setShowList(true)} className="flex items-center gap-1 text-sm text-muted-foreground">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              </div>
              <ChatWindow conversation={selectedConv} currentUser={currentUser} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}