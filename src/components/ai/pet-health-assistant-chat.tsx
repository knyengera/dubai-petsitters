"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User, AlertTriangle } from "lucide-react";
import { base44 } from "@/lib/data";
import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SYSTEM_PROMPT = `You are Saudi Petsitters AI — a bilingual (Arabic/English) pet health assistant for Saudi Arabia.
Your role: provide helpful pet health guidance, symptom assessment, and emergency detection for cats, dogs, and birds.
Guidelines:
- Detect language of the user's message and respond in the SAME language
- For urgent symptoms (bleeding, seizures, difficulty breathing, extreme lethargy, not eating 24h+), add 🚨 EMERGENCY alert and advise immediate vet visit
- For moderate symptoms, provide home care tips and recommend vet visit within 24-48h
- Always suggest nearby vet search via the app for serious cases
- Be empathetic, clear, and concise
- Never diagnose definitively — recommend professional vet consultation
- If in Arabic, use formal Arabic (فصحى)
- Mention Saudi-specific context when relevant (e.g. heat stress, desert climate)`;

const QUICK_PROMPTS_EN = [
  "My cat is vomiting, what should I do?",
  "Dog not eating for 2 days",
  "Bird feathers falling out",
  "Vaccination schedule for a puppy",
];
const QUICK_PROMPTS_AR = [
  "قطتي تتقيأ، ماذا أفعل؟",
  "كلبي لا يأكل منذ يومين",
  "ريش طائري يتساقط",
  "جدول تطعيم الجرو",
];

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function PetHealthAssistantChat() {
  const { t, isRTL } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const userMsg = text || input.trim();
    if (!userMsg) return;
    setInput("");
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMsg },
    ];
    setMessages(newMessages);
    setLoading(true);

    const history = newMessages
      .map(
        (m) =>
          `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`
      )
      .join("\n");
    const prompt = `${SYSTEM_PROMPT}\n\nConversation:\n${history}\n\nAssistant:`;

    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setMessages((prev) => [...prev, { role: "assistant", content: res }]);
    } finally {
      setLoading(false);
    }
  };

  const isEmergency = (text: string) => text?.includes("🚨");

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center text-center pt-4 pb-4">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-3xl flex items-center justify-center mb-3">
              <Bot className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="font-heading text-lg font-bold text-foreground mb-2">
              {t(
                "How can I help your pet today?",
                "كيف يمكنني مساعدة حيوانك اليوم؟"
              )}
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs mb-4">
              {t(
                "Ask about symptoms, vaccinations, nutrition, or emergency care — in Arabic or English.",
                "اسأل عن الأعراض أو التطعيمات أو التغذية أو الرعاية الطارئة — بالعربية أو الإنجليزية."
              )}
            </p>
            <div className="grid grid-cols-1 gap-2 w-full">
              {(isRTL ? QUICK_PROMPTS_AR : QUICK_PROMPTS_EN).map((p) => (
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
                    isEmergency(msg.content) ? "bg-red-500" : "bg-violet-600"
                  }`}
                >
                  {isEmergency(msg.content) ? (
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
                    : isEmergency(msg.content)
                      ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-foreground rounded-es-sm"
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
            <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
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
              "Describe your pet's symptoms...",
              "صف أعراض حيوانك الأليف..."
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
