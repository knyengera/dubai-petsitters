import { NextResponse } from "next/server";
import { z } from "zod";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { fetchPetContext } from "@/lib/ai/pet-context";
import {
  conversationTitleFromMessage,
  isAssistantTopic,
  isEmergencyResponse,
  MAX_CONTEXT_MESSAGES,
} from "@/lib/ai/constants";
import { generateAssistantResponse, isAiConfigured } from "@/lib/ai/providers";
import { aiTable } from "@/lib/ai/db";
import type { AiAssistantMessageRow } from "@/lib/ai/db-types";
import { createClient } from "@/lib/supabase/server";

const chatBodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
  topic: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chatBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { conversationId: existingConversationId, message, topic: rawTopic } = parsed.data;
  const topic = isAssistantTopic(rawTopic) ? rawTopic : "general";

  if (!isAiConfigured()) {
    return NextResponse.json(
      { error: "AI assistant is not configured" },
      { status: 503 }
    );
  }

  let conversationId = existingConversationId;

  if (conversationId) {
    const { data: existing } = await aiTable(supabase, "ai_assistant_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
  } else {
    const { data: created, error: createError } = await aiTable(
      supabase,
      "ai_assistant_conversations"
    )
      .insert({
        user_id: user.id,
        title: conversationTitleFromMessage(message),
        topic,
      })
      .select("id")
      .single();

    if (createError || !created) {
      return NextResponse.json(
        { error: createError?.message ?? "Failed to create conversation" },
        { status: 500 }
      );
    }
    conversationId = String(created.id);
  }

  const { data: priorMessages } = await aiTable(supabase, "ai_assistant_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(MAX_CONTEXT_MESSAGES);

  const petContext = await fetchPetContext(supabase, user.email ?? "");
  const system = buildSystemPrompt(topic, petContext);

  const history = ((priorMessages ?? []) as Pick<AiAssistantMessageRow, "role" | "content">[]).map(
    (m) => ({
      role: m.role,
      content: m.content,
    })
  );

  const { error: userMsgError } = await aiTable(supabase, "ai_assistant_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
    is_emergency: false,
  });

  if (userMsgError) {
    return NextResponse.json({ error: userMsgError.message }, { status: 500 });
  }

  let assistantContent: string;
  try {
    const result = await generateAssistantResponse({
      system,
      messages: [...history, { role: "user", content: message }],
    });
    assistantContent = result.text;
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : "AI request failed";
    return NextResponse.json({ error: errMessage }, { status: 502 });
  }

  const isEmergency = isEmergencyResponse(assistantContent);

  const { error: assistantMsgError } = await aiTable(supabase, "ai_assistant_messages").insert({
    conversation_id: conversationId,
    role: "assistant",
    content: assistantContent,
    is_emergency: isEmergency,
  });

  if (assistantMsgError) {
    return NextResponse.json({ error: assistantMsgError.message }, { status: 500 });
  }

  await aiTable(supabase, "ai_assistant_conversations")
    .update({ topic, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  return NextResponse.json({
    conversationId,
    message: {
      role: "assistant" as const,
      content: assistantContent,
      isEmergency,
    },
  });
}
