import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { getOrAssignCategory } from "@/lib/session/assignment";
import { todayWIB } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const uid = user.id;
  const today = todayWIB();

  // Get assigned (daily) category
  let dailyCategory: string | null = null;
  try {
    dailyCategory = await getOrAssignCategory(uid);
  } catch {
    // No categories available today
  }

  // All live motions today
  const { data: motions } = await admin()
    .from("daily_motion")
    .select("motion_id, category, motion_text, context, claim_form")
    .eq("status", "live")
    .eq("live_date", today);

  // User's sessions today
  const { data: sessions } = await admin()
    .from("session")
    .select("session_id, category, finished")
    .eq("uid", uid)
    .eq("play_date", today);

  const sessionMap = new Map((sessions ?? []).map((s) => [s.category, s]));

  const dailySession = dailyCategory ? sessionMap.get(dailyCategory) : null;
  const dailyDone = dailySession?.finished ?? false;

  // Daily first, then others
  const sorted = [
    ...(motions ?? []).filter((m) => m.category === dailyCategory),
    ...(motions ?? []).filter((m) => m.category !== dailyCategory),
  ];

  const items = sorted.map((m) => {
    const session = sessionMap.get(m.category);
    const state: "new" | "in_progress" | "finished" = session?.finished
      ? "finished"
      : session
      ? "in_progress"
      : "new";
    return {
      category: m.category,
      is_daily: m.category === dailyCategory,
      motion: {
        motion_id: m.motion_id,
        motion_text: m.motion_text,
        context: m.context,
        claim_form: m.claim_form,
      },
      state,
      session_id: session?.session_id ?? null,
    };
  });

  return NextResponse.json({ daily_category: dailyCategory, daily_done: dailyDone, items });
}
