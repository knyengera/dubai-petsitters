import { NextResponse } from "next/server";
import {
  handleSendEmailHook,
  verifyAuthHookSecret,
} from "@/lib/notifications/auth-hook";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!verifyAuthHookSecret(request, rawBody)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Parameters<typeof handleSendEmailHook>[0];
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let result: Awaited<ReturnType<typeof handleSendEmailHook>>;
  try {
    result = await handleSendEmailHook(payload);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unhandled send-email hook error";
    console.error("[auth/hooks/send-email]", message, err);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!result.ok) {
    console.error("[auth/hooks/send-email]", result.error, {
      email: payload.user?.email,
      email_action_type: payload.email_data?.email_action_type,
    });
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({});
}
