import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { respondToSession } from "@/lib/session/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_LENGTH = 20;
const MAX_LENGTH = 2000;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });

  const uid = user.id;
  const body = await request.json();
  const { session_id, user_message } = body || {};

  if (!session_id || !user_message) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "session_id and user_message required" } }, { status: 400 });
  }

  if (user_message.length < MIN_LENGTH) {
    return NextResponse.json({ error: { code: "TOO_SHORT", message: `Min ${MIN_LENGTH} karakter` } }, { status: 400 });
  }

  if (user_message.length > MAX_LENGTH) {
    return NextResponse.json({ error: { code: "TOO_LONG", message: `Max ${MAX_LENGTH} karakter` } }, { status: 400 });
  }

  try {
    const result = await respondToSession(uid, session_id, user_message);
    return NextResponse.json({
      ai_message: result.aiMessage,
      current_round: result.currentRound,
      finished: result.finished,
      result: result.result ? {
        scores: result.result.scores,
        total_score: result.result.totalScore,
        rationale: result.result.rationale,
        feedback: result.result.feedback,
        verdict: result.result.verdict,
      } : undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: { code: "SESSION_ERROR", message: msg } }, { status: 500 });
  }
}
