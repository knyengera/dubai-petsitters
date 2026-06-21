import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { findVerificationSessionByToken } from "@/lib/identity/session-store";
import { retrieveVerificationSession } from "@/lib/identity/stripe-identity";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ s?: string }>;
};

type ErrorState = "missing" | "invalid" | "expired" | "error";

const ERROR_COPY: Record<ErrorState, { title: string; body: string }> = {
  missing: {
    title: "Link incomplete",
    body: "This verification link is missing its code. Scan the QR code on your computer again.",
  },
  invalid: {
    title: "Link not recognized",
    body: "We couldn't find this verification request. Generate a new QR code on your computer.",
  },
  expired: {
    title: "Link expired",
    body: "This verification link has expired. Generate a fresh QR code on your computer and scan it again.",
  },
  error: {
    title: "Something went wrong",
    body: "We couldn't start verification. Please try scanning the QR code again in a moment.",
  },
};

export default async function VerifyIdPage({ searchParams }: PageProps) {
  const { s: token } = await searchParams;

  let target: string | null = null;
  let errorState: ErrorState | null = null;

  if (!token) {
    errorState = "missing";
  } else {
    try {
      const session = await findVerificationSessionByToken(token);
      if (!session) {
        errorState = "invalid";
      } else if (new Date(session.expires_at).getTime() < Date.now()) {
        errorState = "expired";
      } else {
        const stripeSession = await retrieveVerificationSession(
          session.stripe_session_id
        );
        target = stripeSession.url ?? `/verify/id/complete?s=${token}`;
      }
    } catch {
      errorState = "error";
    }
  }

  if (target) redirect(target);

  const copy = ERROR_COPY[errorState ?? "error"];

  return (
    <div
      className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center"
      style={{
        paddingTop: "calc(4rem + env(safe-area-inset-top))",
        paddingBottom: "calc(2rem + env(safe-area-inset-bottom))",
      }}
    >
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-destructive/10">
        <ShieldAlert className="h-7 w-7 text-destructive" />
      </div>
      <h1 className="text-xl font-bold">{copy.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
    </div>
  );
}
