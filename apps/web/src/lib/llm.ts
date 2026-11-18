/**
 * Shared LLM client for Next.js route handlers.
 *
 * Provider order is Gemini → Groq by default (override with LLM_PROVIDER).
 * Each provider has a model fallback list so a retired model name degrades
 * gracefully instead of dropping straight to a rule-based answer.
 */

export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
  /** Per-attempt timeout. Defaults to 25s. */
  timeoutMs?: number;
}

export interface ChatResult {
  text: string;
  model: string;
  provider: "gemini" | "groq";
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function geminiKey(): string {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
}

function groqKey(): string {
  return process.env.GROQ_API_KEY || "";
}

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v && v.trim()))));
}

function geminiModels(): string[] {
  return unique([
    process.env.GEMINI_MODEL,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ]);
}

function groqModels(): string[] {
  return unique([
    process.env.GROQ_CHAT_MODEL,
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
  ]);
}

/**
 * Gemini 2.5 Flash supports `reasoning_effort: "none"`. Higher effort burns
 * output tokens on hidden reasoning and can truncate the visible answer.
 */
function geminiReasoningEffort(): string {
  return process.env.GEMINI_REASONING_EFFORT || "none";
}

export function llmConfigured(): boolean {
  return Boolean(geminiKey() || groqKey());
}

async function callProvider(
  provider: "gemini" | "groq",
  url: string,
  apiKey: string,
  models: string[],
  opts: ChatOptions
): Promise<ChatResult | null> {
  for (const model of models) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: opts.messages,
          temperature: opts.temperature ?? 0.2,
          max_tokens: opts.maxTokens ?? 1024,
          // Gemini 2.5 spends `max_tokens` on hidden thinking tokens unless we
          // lower the effort. Without this, short budgets truncate the answer.
          ...(provider === "gemini" ? { reasoning_effort: geminiReasoningEffort() } : {}),
          ...(opts.responseFormat ? { response_format: opts.responseFormat } : {}),
        }),
        signal: AbortSignal.timeout(opts.timeoutMs ?? 25_000),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.warn(
          `[llm] ${provider}/${model} returned ${res.status}: ${body.slice(0, 200)}`
        );
        continue;
      }

      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (text) return { text, model, provider };
    } catch (err: any) {
      console.warn(`[llm] ${provider}/${model} failed: ${err?.message || err}`);
    }
  }
  return null;
}

/**
 * Sends a chat completion to the configured provider chain.
 * Returns `null` when no provider is configured or every attempt failed,
 * so callers can keep their existing deterministic fallback.
 */
export async function chatComplete(opts: ChatOptions): Promise<ChatResult | null> {
  const preference = (process.env.LLM_PROVIDER || "").toLowerCase();
  const gKey = geminiKey();
  const qKey = groqKey();

  const order: Array<"gemini" | "groq"> =
    preference === "groq"
      ? ["groq", "gemini"]
      : preference === "gemini"
        ? ["gemini", "groq"]
        : gKey
          ? ["gemini", "groq"]
          : ["groq", "gemini"];

  for (const provider of order) {
    if (provider === "gemini" && gKey) {
      const result = await callProvider("gemini", GEMINI_URL, gKey, geminiModels(), opts);
      if (result) return result;
    }
    if (provider === "groq" && qKey) {
      const result = await callProvider("groq", GROQ_URL, qKey, groqModels(), opts);
      if (result) return result;
    }
  }

  return null;
}
