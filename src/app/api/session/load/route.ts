import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { todayWIB } from "@/lib/date";

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
    .select("*")
    .eq("session_id", sessionId)
    .eq("uid", user.id)
    .single();

  if (!session) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Session not found" } }, { status: 404 });

  const today = todayWIB();
  const { data: motion } = await supabase
    .from("daily_motion")
    .select("motion_id, motion_text, context, claim_form")
    .eq("category", session.category)
    .eq("live_date", session.play_date ?? today)
    .maybeSingle();

  return NextResponse.json({
    state: session.finished ? "finished" : "in_progress",
    category: session.category,
    motion: motion
      ? { motion_id: motion.motion_id, motion_text: motion.motion_text, context: motion.context, claim_form: motion.claim_form }
      : null,
    session_id: session.session_id,
    transcript: session.transcript ?? [],
    current_round: session.current_round ?? 0,
    result: null,
  });
}
