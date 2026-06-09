import { NextResponse } from "next/server";
import {
  handleSendSmsHook,
  verifyAuthHookSecret,
} from "@/lib/notifications/auth-hook";

export async function POST(request: Request) {
  if (!verifyAuthHookSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Parameters<typeof handleSendSmsHook>[0];
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = await handleSendSmsHook(payload);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({});
}
