import { redirect } from "next/navigation";

/** Legacy route — vet clinics are now managed under the unified partners admin. */
export default function Page() {
  redirect("/admin/partners");
}
