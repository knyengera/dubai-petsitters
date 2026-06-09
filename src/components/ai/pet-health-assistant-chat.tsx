"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  TOPIC_LABELS,
  TOPIC_QUICK_PROMPTS,
} from "@/lib/ai/prompts";
import type { AssistantTopic, ChatMessage } from "@/lib/ai/types";

const SELECTABLE_TOPICS: AssistantTopic[] = [
  "feeding",
  "travel",
  "heat_safety",
  "basic_care",
  "health",
];

type PetHealthAssistantChatProps = {
  skipHistoryLoad?: boolean;
};

export default function PetHealthAssistantChat({
  skipHistoryLoad = false,
}: PetHealthAssistantChatProps) {
  const { t, isRTL } = useLanguage();
  const { user, isLoadingAuth } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [topic, setTopic] = useState<AssistantTopic>("general");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadRecentConversation = useCallback(async () => {
    setLoadingHistory(true);
    setError(null);
    try {
      const listRes = await fetch("/api/ai/conversations");
      if (!listRes.ok) {
        if (listRes.status === 401) return;
        throw new Error("Failed to load conversations");
      }
      const { conversations } = await listRes.json();
      if (!conversations?.length) {
        setMessages([]);
        setConversationId(null);
        return;
      }

      const latest = conversations[0];
      const detailRes = await fetch(`/api/ai/conversations/${latest.id}`);
      if (!detailRes.ok) throw new Error("Failed to load conversation");

      const { conversation, messages: loadedMessages } = await detailRes.json();
      setConversationId(conversation.id);
      if (conversation.topic) setTopic(conversation.topic);
      setMessages(
        (loadedMessages ?? []).map(
          (m: { role: string; content: string; isEmergency?: boolean }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            isEmergency: m.isEmergency,
          })
        )
      );
    } catch {
      setError(
        t(
          "Could not load your chat history. You can still start a new conversation.",
          "تعذر تحميل سجل المحادثة. يمكنك بدء محادثة جديدة."
        )
      );
    } finally {
      setLoadingHistory(false);
    }
  }, [t]);

  useEffect(() => {
    if (!user) {
      setLoadingHistory(false);
      return;
    }
    if (skipHistoryLoad) {
      setLoadingHistory(false);
      return;
    }
    loadRecentConversation();
  }, [user, skipHistoryLoad, loadRecentConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    if (!user) return;

    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");
    setError(null);

    const previousMessages = messages;
    const optimistic: ChatMessage[] = [
      ...previousMessages,
      { role: "user", content: userMsg },
    ];
    setMessages(optimistic);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversationId ?? undefined,
          message: userMsg,
          topic,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessages(previousMessages);
        setError(
          data.error ??
            t(
              "Something went wrong. Please try again.",
              "حدث خطأ. يرجى المحاولة مرة أخرى."
            )
        );
        return;
      }

      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message.content,
          isEmergency: data.message.isEmergency,
        },
      ]);
    } catch {
      setMessages(previousMessages);
      setError(
        t(
          "Network error. Please check your connection and try again.",
          "خطأ في الشبكة. يرجى التحقق من الاتصال والمحاولة مرة أخرى."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const isEmergency = (msg: ChatMessage) =>
    msg.isEmergency ?? msg.content?.includes("🚨");

  const quickPrompts =
    TOPIC_QUICK_PROMPTS[topic][isRTL ? "ar" : "en"];

  if (isLoadingAuth || loadingHistory) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-background px-4 text-sm text-muted-foreground">
        {t("Loading assistant...", "جار تحميل المساعد...")}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center bg-background px-6 text-center">
        <Bot className="mb-3 h-8 w-8 text-primary" />
        <h2 className="font-heading text-lg font-bold text-foreground">
          {t("Sign in to use the AI assistant", "سجل الدخول لاستخدام المساعد الذكي")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "Pet care guidance is available for authenticated users only.",
            "إرشادات رعاية الحيوانات متاحة للمستخدمين المسجلين فقط."
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      <div className="px-4 py-2 border-b border-border shrink-0 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max">
          {SELECTABLE_TOPICS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTopic(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                topic === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t(TOPIC_LABELS[key].en, TOPIC_LABELS[key].ar)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {error && (
          <p className="text-xs text-destructive text-center px-2">{error}</p>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center pt-2 pb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-3">
              <Bot className="w-8 h-8 text-primary" />
            </div>
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">
              {t(
                "How can I help your pet today?",
                "كيف يمكنني مساعدة حيوانك اليوم؟"
              )}
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs mb-4">
              {t(
                "Ask about feeding, travel, heat safety, daily care, or health — in Arabic or English.",
                "اسأل عن التغذية أو السفر أو الحرارة أو الرعاية اليومية أو الصحة — بالعربية أو الإنجليزية."
              )}
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => sendMessage(p)}
                  className="text-start bg-card border border-border rounded-2xl px-4 py-3 text-sm text-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-1 ${
                    isEmergency(msg) ? "bg-destructive" : "bg-primary"
                  }`}
                >
                  {isEmergency(msg) ? (
                    <AlertTriangle className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-ee-sm"
                    : isEmergency(msg)
                      ? "bg-destructive/10 border border-destructive/20 text-foreground rounded-es-sm"
                      : "bg-card border border-border text-foreground rounded-es-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-es-sm px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-border bg-background shrink-0">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && sendMessage()
            }
            placeholder={t(
              "Ask about feeding, travel, heat safety, or care...",
              "اسأل عن التغذية أو السفر أو الحرارة أو الرعاية..."
            )}
            className="rounded-2xl flex-1"
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            size="icon"
            className="rounded-2xl w-12 h-12 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <footer className="px-4 py-2.5 border-t border-border bg-muted/40 shrink-0">
        <p className="text-[11px] leading-snug text-center text-muted-foreground">
          {t(
            "AI guidance only — not a substitute for professional veterinary care",
            "إرشادات ذكاء اصطناعي فقط — لا تغني عن الرعاية البيطرية المتخصصة"
          )}
        </p>
      </footer>
    </div>
  );
}
