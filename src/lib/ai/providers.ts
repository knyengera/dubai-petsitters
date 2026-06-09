import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import {
  DEFAULT_OPENAI_MODEL,
  DEFAULT_OPENROUTER_MODEL,
  OPENROUTER_BASE_URL,
} from "@/lib/ai/constants";

type ChatMessage = { role: "user" | "assistant"; content: string };

export type GenerateAssistantInput = {
  system: string;
  messages: ChatMessage[];
};

export type AiProviderName = "openrouter" | "openai";

export type GenerateAssistantResult = {
  text: string;
  provider: AiProviderName;
};

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
}

function getOpenRouterClient() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  return createOpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey,
    headers: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Saudi Petsitters",
    },
  });
}

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  return createOpenAI({ apiKey });
}

export async function generateAssistantResponse(
  input: GenerateAssistantInput
): Promise<GenerateAssistantResult> {
  const failures: string[] = [];

  const openrouter = getOpenRouterClient();
  if (openrouter) {
    try {
      const result = await generateText({
        model: openrouter(process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL),
        system: input.system,
        messages: input.messages,
      });

      if (result.text?.trim()) {
        return { text: result.text, provider: "openrouter" };
      }

      failures.push("OpenRouter returned an empty response");
    } catch (error) {
      failures.push(
        error instanceof Error ? error.message : "OpenRouter request failed"
      );
    }
  }

  const openai = getOpenAIClient();
  if (openai) {
    try {
      const result = await generateText({
        model: openai(process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL),
        system: input.system,
        messages: input.messages,
      });

      return { text: result.text, provider: "openai" };
    } catch (error) {
      failures.push(
        error instanceof Error ? error.message : "OpenAI request failed"
      );
    }
  }

  if (failures.length) {
    throw new Error(`All AI providers failed: ${failures.join("; ")}`);
  }

  throw new Error("AI assistant is not configured");
}
