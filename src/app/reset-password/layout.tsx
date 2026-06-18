import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata = buildPageMetadata({
  title: "Reset Password",
  description: "Set a new password for your Saudi Petsitters account.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
