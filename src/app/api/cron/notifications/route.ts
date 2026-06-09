import { NextResponse } from "next/server";
import {
  dispatchPendingNotifications,
  enqueuePetHealthReminders,
} from "@/lib/notifications/dispatch";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const includeReminders = url.searchParams.get("reminders") !== "false";

  let remindersEnqueued = 0;
  if (includeReminders) {
    try {
      remindersEnqueued = await enqueuePetHealthReminders();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Reminder enqueue failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const result = await dispatchPendingNotifications();
  return NextResponse.json({ ...result, remindersEnqueued });
}
