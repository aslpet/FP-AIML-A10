import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) return NextResponse.json({ error: { code: "INVALID_INPUT", message: "session_id required" } }, { status: 400 });

  const { data: session } = await supabase
    .from("session")
    .select("*, daily_motion(motion_text, category)")
    .eq("session_id", sessionId)
    .eq("uid", user.id)
    .single();

  if (!session) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Session not found" } }, { status: 404 });

  return NextResponse.json({
    scores: {
      penalaran: session.score_penalaran,
      relevansi: session.score_relevansi,
      responsiveness: session.score_responsiveness,
      kejelasan: session.score_kejelasan,
    },
    total_score: session.total_score,
    rationale: session.rationale,
    feedback: session.feedback,
    verdict: session.verdict,
    motion_text: (session.daily_motion as { motion_text: string })?.motion_text,
    category: session.category,
    play_date: session.play_date,
  });
}
