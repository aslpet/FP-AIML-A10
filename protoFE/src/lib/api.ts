/**
 * Client-side helpers untuk memanggil API routes Gemini.
 * Fallback ke mock jika API gagal atau GEMINI_API_KEY belum diatur.
 */

import type { DimensionId, Scores } from "./types";

interface DebateResponse {
  ai_message: string;
  error?: string;
}

interface EvaluateResponse {
  penalaran: number;
  relevansi: number;
  responsiveness: number;
  kejelasan: number;
  rationale: Record<DimensionId, string>;
  feedback: string;
  error?: string;
}

/**
 * Minta Gemini menghasilkan respons debat.
 * @param motionText - Teks mosi
 * @param context - Konteks mosi
 * @param userMessage - Argumen user (kosong untuk opening)
 * @param history - Riwayat percakapan sebelumnya
 */
export async function callDebateAPI(
  motionText: string,
  context: string,
  userMessage?: string,
  history?: string,
): Promise<DebateResponse> {
  const res = await fetch("/api/debate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motionText, context, userMessage, history }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    console.warn("[api] debate error:", data.error);
  }
  return data as DebateResponse;
}

/**
 * Minta Gemini mengevaluasi argumen user setelah 3 ronde.
 */
export async function callEvaluateAPI(
  motionText: string,
  context: string,
  userArgs: [string, string, string],
  aiSummary: string,
): Promise<EvaluateResponse> {
  const res = await fetch("/api/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ motionText, context, userArgs, aiSummary }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    console.warn("[api] evaluate error:", data.error);
  }
  return data as EvaluateResponse;
}
