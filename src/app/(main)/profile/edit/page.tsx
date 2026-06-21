import { Suspense } from "react";
import ProfileEditForm from "@/components/profile/ProfileEditForm";

export default function ProfileEditPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-muted-foreground">Loading…</div>
      }
    >
      <ProfileEditForm />
    </Suspense>
  );
}
