import { CheckCircle, Monitor } from "lucide-react";

export const dynamic = "force-dynamic";

export default function VerifyIdCompletePage() {
  return (
    <div
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center"
      style={{
        paddingTop: "calc(4rem + env(safe-area-inset-top))",
        paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-green-100">
        <CheckCircle className="h-7 w-7 text-green-600" />
      </div>
      <h1 className="text-xl font-bold">Verification submitted</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Thanks! We&apos;re reviewing your documents. This usually takes only a
        few moments.
      </p>
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Monitor className="h-4 w-4 shrink-0" />
        <span>Return to your computer to finish setting up your account.</span>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        You can close this tab.
      </p>
    </div>
  );
}
