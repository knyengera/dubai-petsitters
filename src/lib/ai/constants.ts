export const ASSISTANT_TOPICS = [
  "feeding",
  "travel",
  "heat_safety",
  "basic_care",
  "health",
  "general",
] as const;

export const MAX_CONTEXT_MESSAGES = 20;
export const DEFAULT_OPENROUTER_MODEL = "openrouter/free";
export const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export function isAssistantTopic(value: unknown): value is (typeof ASSISTANT_TOPICS)[number] {
  return typeof value === "string" && ASSISTANT_TOPICS.includes(value as (typeof ASSISTANT_TOPICS)[number]);
}

export function conversationTitleFromMessage(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, " ");
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 57)}...`;
}

export function isEmergencyResponse(content: string): boolean {
  return content.includes("🚨");
}
