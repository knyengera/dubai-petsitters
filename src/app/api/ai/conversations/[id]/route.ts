import { NextResponse } from "next/server";
import type {
  AiAssistantConversationRow,
  AiAssistantMessageRow,
} from "@/lib/ai/db-types";
import { aiTable } from "@/lib/ai/db";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: conversation, error: convError } = await aiTable(
    supabase,
    "ai_assistant_conversations"
  )
    .select("id, title, topic, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (convError) {
    return NextResponse.json({ error: convError.message }, { status: 500 });
  }

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { data: messages, error: msgError } = await aiTable(
    supabase,
    "ai_assistant_messages"
  )
    .select("id, role, content, is_emergency, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  const typedConversation = conversation as AiAssistantConversationRow;
  const typedMessages = (messages ?? []) as AiAssistantMessageRow[];

  return NextResponse.json({
    conversation: typedConversation,
    messages: typedMessages.map((m) => ({
      role: m.role,
      content: m.content,
      isEmergency: m.is_emergency,
    })),
  });
}
