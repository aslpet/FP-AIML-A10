import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "@/lib/config";

/**
 * Shared Gemini client — lazy, single instance.
 * Dipakai oleh semua pemanggil LLM: pipeline, persona, evaluator.
 * Acuan: TRD-00 §5 (disiplin token), NFR-13 (JSON ketat), NFR-14 (retry-backoff)
 */

const _clients = new Map<string, GoogleGenerativeAI>();

function getGenAI(apiKey: string): GoogleGenerativeAI {
  if (!_clients.has(apiKey)) {
    _clients.set(apiKey, new GoogleGenerativeAI(apiKey));
  }
  return _clients.get(apiKey)!;
}

export interface LlmOptions {
  model: string;
  apiKey?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

/**
 * Panggil Gemini dengan retry + JSON fence removal + JSON parsing.
 * Return parsed JSON object.
 */
export async function callGeminiJson<T>(
  prompt: string,
  options: LlmOptions,
): Promise<T> {
  const apiKey = options.apiKey || config.gemini.apiKey;
  const model = getGenAI(apiKey).getGenerativeModel({
    model: options.model,
    generationConfig: {
      temperature: options.temperature ?? 0.7,
      maxOutputTokens: options.maxOutputTokens ?? 4096,
      responseMimeType: "application/json",
    },
  });

  const MAX_RETRIES = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return parseJsonResponse<T>(text);
    } catch (err) {
      lastError = err;
      const retryDelay = extractRetryDelay(err);

      if (retryDelay && retryDelay >= 1000 && attempt < MAX_RETRIES) {
        console.warn(
          `[llm] Rate limited, retrying in ${(retryDelay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        await sleep(retryDelay);
        continue;
      }
      if (attempt >= MAX_RETRIES) throw err;
      throw err;
    }
  }

  throw lastError;
}

function parseJsonResponse<T>(text: string): T {
  let cleaned = text.trim();

  // Strip markdown fences
  cleaned = cleaned
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  // If still not JSON, try regex extraction
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) cleaned = match[0];
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.error("[llm] JSON parse failed, last 200 chars:", cleaned.slice(-200));
    throw new Error("Failed to parse LLM JSON response");
  }
}

function extractRetryDelay(err: unknown): number | null {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: number }).status;
    if (status === 429) {
      const details = (err as { errorDetails?: Array<{ retryDelay?: string }> }).errorDetails;
      if (details) {
        for (const d of details) {
          if (d.retryDelay) {
            const seconds = parseFloat(d.retryDelay.replace("s", ""));
            if (!isNaN(seconds)) return Math.ceil(seconds * 1000);
          }
        }
      }
      return 2000;
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
