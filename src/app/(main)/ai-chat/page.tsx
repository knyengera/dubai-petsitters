import { redirect } from "next/navigation";

/** Legacy route — opens the global AI assistant widget on the dashboard. */
export default function Page() {
  redirect("/dashboard?openAssistant=1");
}
