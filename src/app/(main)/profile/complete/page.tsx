import { Suspense } from "react";
import ProfileCompletionWizard from "@/components/profile/ProfileCompletionWizard";

export default function ProfileCompletePage() {
  return (
    <div
      className="mx-auto max-w-3xl px-4 py-8"
      style={{
        paddingTop: "calc(1rem + env(safe-area-inset-top))",
        paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
      }}
    >
      <Suspense
        fallback={
          <div className="py-20 text-center text-muted-foreground">Loading…</div>
        }
      >
        <ProfileCompletionWizard />
      </Suspense>
    </div>
  );
}
