"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Bot, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/language-context";
import { usePetHealthAssistant } from "@/lib/pet-health-assistant-context";
import { Button } from "@/components/ui/button";
import PetHealthAssistantChat from "@/components/ai/pet-health-assistant-chat";

const OPEN_QUERY = "openAssistant";

export default function PetHealthAssistantWidget() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { open, setOpen, openAssistant } = usePetHealthAssistant();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;
    if (searchParams.get(OPEN_QUERY) !== "1") return;
    openAssistant();
    const params = new URLSearchParams(searchParams.toString());
    params.delete(OPEN_QUERY);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [user, searchParams, openAssistant, router, pathname]);

  if (!user) return null;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label={t("Close assistant", "إغلاق المساعد")}
          className="fixed inset-0 z-40 bg-black/20 supports-backdrop-filter:backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("AI Pet Health Assistant", "مساعد الصحة الذكي")}
          className="fixed z-50 end-4 flex w-[min(100vw-2rem,24rem)] h-[min(78dvh,36rem)] flex-col overflow-hidden rounded-t-2xl border border-border bg-popover text-popover-foreground shadow-2xl bottom-[calc(5.5rem+4rem+env(safe-area-inset-bottom))] lg:bottom-[calc(1.5rem+4rem)]"
        >
          <div className="flex items-start justify-between gap-2 px-4 py-3 border-b border-border shrink-0 rounded-t-2xl bg-popover">
            <div className="min-w-0">
              <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
                <Bot className="w-5 h-5 text-primary shrink-0" />
                {t("AI Pet Health Assistant", "مساعد الصحة الذكي")}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(
                  "Online · Bilingual guidance for your pet",
                  "متصل · إرشادات ثنائية اللغة لحيوانك"
                )}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label={t("Close", "إغلاق")}
              className="shrink-0 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            <PetHealthAssistantChat />
          </div>
        </div>
      )}

      <Button
        type="button"
        onClick={() => (open ? setOpen(false) : openAssistant())}
        size="icon"
        aria-label={t("AI Pet Health Assistant", "مساعد الصحة الذكي")}
        aria-expanded={open}
        className="fixed z-50 end-4 rounded-full w-14 h-14 shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90 text-primary-foreground bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6"
      >
        <Bot className="w-6 h-6" />
      </Button>
    </>
  );
}
