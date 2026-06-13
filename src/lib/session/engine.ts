import { admin } from "@/lib/supabase/admin";
import { todayWIB, daysAgoWIB } from "@/lib/date";
import { config } from "@/lib/config";
import { callGeminiJson } from "@/lib/llm/gemini";
import { buildPersonaPrompt } from "@/lib/llm/prompts/persona";
import { buildEvaluatorPrompt } from "@/lib/llm/prompts/evaluator";
import { aggregate, computeVerdict, type DimensionScores } from "./scoring";
import { updateStreak } from "@/lib/user/streak";
import type { CategoryId } from "@/lib/pipeline/types";
import type { RhetoricStyle, StancePolicy } from "@/lib/llm/prompts/persona";

interface Turn {
  role: "ai" | "user";
  content: string;
  round: number;
}

interface EvalResult {
  penalaran: number;
  relevansi: number;
  responsiveness: number;
  kejelasan: number;
  rationale: {
    penalaran: string;
    relevansi: string;
    responsiveness: string;
    kejelasan: string;
  };
  feedback: string;
}

/**
 * Mesin sesi debat — orkestrasi 3 ronde.
 * Acuan: TRD-04 §4 (alur sesi), TRD-05 (evaluasi), TRD-06 §2 (streak)
 */

export async function startSession(
  uid: string,
  category: CategoryId,
): Promise<{ sessionId: string; aiMessage: string }> {
  const today = todayWIB();

  // Ambil mosi live
  const { data: motion } = await admin()
    .from("daily_motion")
    .select("*")
    .eq("category", category)
    .eq("status", "live")
    .eq("live_date", today)
    .single();

  if (!motion) throw new Error("No live motion for this category");

  // Opening prompt — tanpa riwayat, tanpa argumen user
  const openingPrompt = buildPersonaPrompt({
    style: motion.persona_style as RhetoricStyle,
    stance: motion.persona_stance as StancePolicy,
    aiPosition: motion.ai_position,
    motionText: motion.motion_text,
    context: motion.context,
    hasBeban: (motion.safety_flags as Record<string, unknown>)?.beban === true,
    historySummary: "",
    userMessage: "",
  });

  const { ai_message } = await callGeminiJson<{ ai_message: string }>(
    openingPrompt,
    { model: config.gemini.modelPersona },
  );

  // Insert session
  const transcript: Turn[] = [{ role: "ai", content: ai_message, round: 0 }];

  const { data: session } = await admin()
    .from("session")
    .insert({
      uid,
      play_date: today,
      category,
      motion_id: motion.motion_id,
      transcript,
      current_round: 0,
      finished: false,
    })
    .select("session_id")
    .single();

  if (!session) throw new Error("Failed to create session");

  return { sessionId: session.session_id, aiMessage: ai_message };
}

export async function respondToSession(
  uid: string,
  sessionId: string,
  userMessage: string,
): Promise<{
  aiMessage: string;
  currentRound: number;
  finished: boolean;
  result?: {
    scores: DimensionScores;
    totalScore: number;
    rationale: Record<string, string>;
    feedback: string;
    verdict: string;
  };
}> {
  // Load session & verify ownership
  const { data: session } = await admin()
    .from("session")
    .select("*")
    .eq("session_id", sessionId)
    .eq("uid", uid)
    .single();

  if (!session) throw new Error("Session not found or not yours");
  if (session.finished) throw new Error("Session already finished");

  const transcript = session.transcript as Turn[];
  const currentRound = (session.current_round as number) + 1;

  // Append user message + persist sebelum LLM (TRD-04 §6: state tersimpan, user bisa lanjut)
  transcript.push({ role: "user", content: userMessage, round: currentRound });

  await admin()
    .from("session")
    .update({ transcript, current_round: currentRound })
    .eq("session_id", sessionId);

  // Load motion
  const { data: motion } = await admin()
    .from("daily_motion")
    .select("*")
    .eq("motion_id", session.motion_id)
    .single();

  if (!motion) throw new Error("Motion not found");

  if (currentRound <= 2) {
    // Ronde 1–2: AI tanggapan (tanpa skor)
    const historySummary = buildHistorySummary(transcript);
    const personaPrompt = buildPersonaPrompt({
      style: motion.persona_style as RhetoricStyle,
      stance: motion.persona_stance as StancePolicy,
      aiPosition: motion.ai_position,
      motionText: motion.motion_text,
      context: motion.context,
      hasBeban: (motion.safety_flags as Record<string, unknown>)?.beban === true,
      historySummary,
      userMessage,
    });

    const { ai_message } = await callGeminiJson<{ ai_message: string }>(
      personaPrompt,
      { model: config.gemini.modelPersona },
    );

    transcript.push({ role: "ai", content: ai_message, round: currentRound });

    await admin()
      .from("session")
      .update({ transcript, current_round: currentRound })
      .eq("session_id", sessionId);

    return { aiMessage: ai_message, currentRound, finished: false };
  }

  // Ronde 3: AI penutup + evaluasi
  const historySummary = buildHistorySummary(transcript);
  const closingPrompt = buildPersonaPrompt({
    style: motion.persona_style as RhetoricStyle,
    stance: motion.persona_stance as StancePolicy,
    aiPosition: motion.ai_position,
    motionText: motion.motion_text,
    context: motion.context,
    hasBeban: (motion.safety_flags as Record<string, unknown>)?.beban === true,
    historySummary,
    userMessage,
  });

  const { ai_message: closingMessage } = await callGeminiJson<{ ai_message: string }>(
    closingPrompt,
    { model: config.gemini.modelPersona, maxOutputTokens: 2048 },
  );

  transcript.push({ role: "ai", content: closingMessage, round: 3 });

  // Evaluator — terpisah, netral dari persona
  const userArgs = extractUserArgs(transcript);
  const aiSummary = buildAiSummary(transcript);
  const evalPrompt = buildEvaluatorPrompt({
    motionText: motion.motion_text,
    context: motion.context,
    userArgs: userArgs as [string, string, string],
    aiSummary,
  });

  let evalResult: EvalResult;
  try {
    evalResult = await callGeminiJson<EvalResult>(
      evalPrompt,
      { model: config.gemini.modelEvaluator, temperature: 0.3 },
    );
  } catch {
    // Fallback: skor default netral
    console.warn("[session] Evaluator failed, using default scores");
    evalResult = {
      penalaran: 3,
      relevansi: 3,
      responsiveness: 3,
      kejelasan: 3,
      rationale: {
        penalaran: "Skor default — evaluator LLM gagal.",
        relevansi: "Skor default — evaluator LLM gagal.",
        responsiveness: "Skor default — evaluator LLM gagal.",
        kejelasan: "Skor default — evaluator LLM gagal.",
      },
      feedback: "Maaf, sistem evaluasi sedang mengalami gangguan. Skor ini adalah perkiraan netral.",
    };
  }

  // Clamp + compute
  const scores: DimensionScores = {
    penalaran: clamp(evalResult.penalaran, 1, 5),
    relevansi: clamp(evalResult.relevansi, 1, 5),
    responsiveness: clamp(evalResult.responsiveness, 1, 5),
    kejelasan: clamp(evalResult.kejelasan, 1, 5),
  };
  const totalScore = aggregate(scores);
  const verdict = computeVerdict(scores);

  // Update streak (server-side)
  const today = todayWIB();
  const { data: user } = await admin()
    .from("app_user")
    .select("streak_count, last_played_date, is_anonymous")
    .eq("uid", uid)
    .single();

  const isFirstToday = !user?.last_played_date || user.last_played_date !== today;
  const newStreak = updateStreak(
    { streakCount: user?.streak_count ?? 0, lastPlayedDate: user?.last_played_date ?? null },
    today,
    isFirstToday,
  );

  await admin()
    .from("app_user")
    .upsert({
      uid,
      is_anonymous: user?.is_anonymous ?? true,
      streak_count: newStreak.streakCount,
      last_played_date: newStreak.lastPlayedDate,
    });

  // Update session
  await admin()
    .from("session")
    .update({
      transcript,
      current_round: 3,
      finished: true,
      score_penalaran: scores.penalaran,
      score_relevansi: scores.relevansi,
      score_responsiveness: scores.responsiveness,
      score_kejelasan: scores.kejelasan,
      rationale: evalResult.rationale,
      total_score: totalScore,
      feedback: evalResult.feedback,
      verdict,
      rubric_version: "1.0",
      model_version: config.gemini.modelEvaluator,
      finished_at: new Date().toISOString(),
    })
    .eq("session_id", sessionId);

  return {
    aiMessage: closingMessage,
    currentRound: 3,
    finished: true,
    result: {
      scores,
      totalScore,
      rationale: evalResult.rationale,
      feedback: evalResult.feedback,
      verdict,
    },
  };
}

function buildHistorySummary(transcript: Turn[]): string {
  return transcript
    .slice(-4)
    .map((t) => `[${t.role === "ai" ? "AI" : "User"} R${t.round}]: ${t.content.slice(0, 200)}`)
    .join("\n");
}

function extractUserArgs(transcript: Turn[]): string[] {
  return transcript
    .filter((t) => t.role === "user")
    .map((t) => t.content);
}

function buildAiSummary(transcript: Turn[]): string {
  return transcript
    .filter((t) => t.role === "ai" && t.round > 0 && t.round < 3)
    .map((t) => `Ronde ${t.round}: ${t.content.slice(0, 200)}`)
    .join("\n");
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
