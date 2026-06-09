export type AssistantTopic =
  | "feeding"
  | "travel"
  | "heat_safety"
  | "basic_care"
  | "health"
  | "general";

export type ChatMessageRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
  isEmergency?: boolean;
};

export type AssistantConversation = {
  id: string;
  title: string | null;
  topic: AssistantTopic | null;
  created_at: string;
  updated_at: string;
};
