"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { reportForumContent } from "@/lib/forum/actions";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";
import type { ForumReportReason } from "@/lib/forum/types";
import { useToast } from "@/components/ui/use-toast";

type ReportDialogProps = {
  targetType: "topic" | "reply";
  targetId: string;
  triggerClassName?: string;
};

export default function ReportDialog({
  targetType,
  targetId,
  triggerClassName,
}: ReportDialogProps) {
  const { user, navigateToLogin } = useAuth();
  const { toast } = useToast();
  const { s, reportReasons, t } = useForumI18n();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ForumReportReason>("spam");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      navigateToLogin();
      return;
    }
    setLoading(true);
    const result = await reportForumContent({
      target_type: targetType,
      target_id: targetId,
      reason,
      details,
    });
    setLoading(false);
    if (result.ok === false) {
      toast({ title: s.reportFailed, description: result.error, variant: "destructive" });
      return;
    }
    toast({
      title: s.reportSubmitted,
      description: s.reportSubmittedDesc,
    });
    setOpen(false);
    setDetails("");
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={triggerClassName ?? "rounded-lg gap-1.5 text-muted-foreground"}
        onClick={() => (user ? setOpen(true) : navigateToLogin())}
      >
        <Flag className="w-3.5 h-3.5" />
        {s.report}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{s.reportContent}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="mb-1.5 block">{s.reason}</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as ForumReportReason)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reportReasons).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block">{s.detailsOptional}</Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder={s.reportDetailsPlaceholder}
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setOpen(false)}>
                {s.cancel}
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleSubmit} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : s.submitReport}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("Need help? Read our", "تحتاج مساعدة؟ اقرأ")}{" "}
              <Link href="/terms" className="text-primary underline">
                {t("community guidelines", "إرشادات المجتمع")}
              </Link>
              .
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
