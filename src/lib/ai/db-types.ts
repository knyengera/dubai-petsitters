export type AiAssistantConversationRow = {
  id: string;
  user_id: string;
  title: string | null;
  topic: string | null;
  created_at: string;
  updated_at: string;
};

export type AiAssistantMessageRow = {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  is_emergency: boolean;
  created_at: string;
};
