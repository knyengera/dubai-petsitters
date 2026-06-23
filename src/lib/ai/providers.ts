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

function isOpenRouterKey(key: string | undefined): key is string {
  return Boolean(key?.startsWith("sk-or-"));
}

/** Prefer OPENROUTER_API_KEY; accept a misplaced sk-or-v1 key in OPENAI_API_KEY. */
export function resolveOpenRouterApiKey(): string | undefined {
  const openrouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  if (isOpenRouterKey(openrouterKey)) {
    return openrouterKey;
  }

  if (isOpenRouterKey(openaiKey)) {
    return openaiKey;
  }

  return openrouterKey || undefined;
}

function resolveOpenAiApiKey(): string | undefined {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openaiKey || isOpenRouterKey(openaiKey)) {
    return undefined;
  }

  return openaiKey;
}

export function isAiConfigured(): boolean {
  return Boolean(resolveOpenRouterApiKey() || resolveOpenAiApiKey());
}

function getOpenRouterClient() {
  const apiKey = resolveOpenRouterApiKey();
  if (!apiKey) return null;

  return createOpenAI({
    baseURL: OPENROUTER_BASE_URL,
    apiKey,
    headers: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      "X-Title": "Dubai Petsitters",
    },
  });
}

function getOpenAIClient() {
  const apiKey = resolveOpenAiApiKey();
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
        model: openrouter.chat(process.env.OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL),
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
        model: openai.chat(process.env.OPENAI_MODEL ?? DEFAULT_OPENAI_MODEL),
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
    const hint = isOpenRouterKey(process.env.OPENROUTER_API_KEY?.trim())
      ? ""
      : isOpenRouterKey(process.env.OPENAI_API_KEY?.trim())
        ? " (OpenRouter key detected in OPENAI_API_KEY — move it to OPENROUTER_API_KEY)"
        : process.env.OPENROUTER_API_KEY
          ? " (check OPENROUTER_API_KEY is a valid sk-or-v1 key from https://openrouter.ai/settings/keys)"
          : "";

    throw new Error(`All AI providers failed: ${failures.join("; ")}${hint}`);
  }

  throw new Error(
    "AI assistant is not configured. Set OPENROUTER_API_KEY in .env.local (https://openrouter.ai/settings/keys)."
  );
}
