import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrAssignCategory } from "@/lib/session/assignment";
import { todayWIB } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });

  const uid = user.id;
  const today = todayWIB();

  // Upsert app_user
  const { data: appUser } = await supabase
    .from("app_user")
    .select("uid")
    .eq("uid", uid)
    .maybeSingle();

  if (!appUser) {
    await supabase.from("app_user").insert({ uid, is_anonymous: user.is_anonymous ?? true });
  }

  // Get or assign category
  let category: string;
  try {
    category = await getOrAssignCategory(uid);
  } catch {
    return NextResponse.json({
      state: "unavailable",
      category: null,
      motion: null,
      session_id: null,
      transcript: [],
      current_round: 0,
      result: null,
    });
  }

  // Get live motion
  const { data: motion } = await supabase
    .from("daily_motion")
    .select("motion_id, motion_text, context, claim_form")
    .eq("category", category)
    .eq("status", "live")
    .eq("live_date", today)
    .single();

  // Check existing session
  const { data: session } = await supabase
    .from("session")
    .select("*")
    .eq("uid", uid)
    .eq("play_date", today)
    .eq("category", category)
    .maybeSingle();

  if (session?.finished) {
    return NextResponse.json({
      state: "finished",
      category,
      motion: motion ? { motion_id: motion.motion_id, motion_text: motion.motion_text, context: motion.context, claim_form: motion.claim_form } : null,
      session_id: session.session_id,
      transcript: session.transcript,
      current_round: session.current_round,
      result: {
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
      },
    });
  }

  if (session) {
    return NextResponse.json({
      state: "in_progress",
      category,
      motion: motion ? { motion_id: motion.motion_id, motion_text: motion.motion_text, context: motion.context, claim_form: motion.claim_form } : null,
      session_id: session.session_id,
      transcript: session.transcript,
      current_round: session.current_round,
      result: null,
    });
  }

  return NextResponse.json({
    state: "new",
    category,
    motion: motion ? { motion_id: motion.motion_id, motion_text: motion.motion_text, context: motion.context, claim_form: motion.claim_form } : null,
    session_id: null,
    transcript: [],
    current_round: 0,
    result: null,
  });
}
