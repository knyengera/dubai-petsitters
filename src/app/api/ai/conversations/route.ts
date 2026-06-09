import { NextResponse } from "next/server";
import type { AiAssistantConversationRow } from "@/lib/ai/db-types";
import { aiTable } from "@/lib/ai/db";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await aiTable(supabase, "ai_assistant_conversations")
    .select("id, title, topic, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    conversations: (data ?? []) as AiAssistantConversationRow[],
  });
}
