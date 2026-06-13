import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });

  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "30");
  const before = request.nextUrl.searchParams.get("before");

  let query = supabase
    .from("session")
    .select("session_id, play_date, category, motion_id, motion_id(motion_text), total_score, score_penalaran, score_relevansi, score_responsiveness, score_kejelasan")
    .eq("uid", user.id)
    .eq("finished", true)
    .order("play_date", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("play_date", before);

  const { data: sessions } = await query;

  const items = (sessions ?? []).map((s) => ({
    play_date: s.play_date,
    category: s.category,
    motion_text: (s.motion_id as unknown as { motion_text: string })?.motion_text || "",
    total_score: s.total_score,
    scores: {
      penalaran: s.score_penalaran,
      relevansi: s.score_relevansi,
      responsiveness: s.score_responsiveness,
      kejelasan: s.score_kejelasan,
    },
  }));

  const trend = {
    penalaran: items.map((s) => ({ date: s.play_date, value: s.scores.penalaran })).reverse(),
    relevansi: items.map((s) => ({ date: s.play_date, value: s.scores.relevansi })).reverse(),
    responsiveness: items.map((s) => ({ date: s.play_date, value: s.scores.responsiveness })).reverse(),
    kejelasan: items.map((s) => ({ date: s.play_date, value: s.scores.kejelasan })).reverse(),
  };

  return NextResponse.json({ sessions: items, trend });
}
