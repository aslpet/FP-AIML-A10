import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNextCategory } from "@/lib/session/assignment";
import { todayWIB } from "@/lib/date";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });

  const next = await getNextCategory(user.id);
  if (!next) return new NextResponse(null, { status: 204 });

  const { data: motion } = await supabase
    .from("daily_motion")
    .select("motion_id, motion_text, context, claim_form")
    .eq("category", next)
    .eq("status", "live")
    .eq("live_date", todayWIB())
    .single();

  return NextResponse.json({
    category: next,
    motion: motion ? { motion_id: motion.motion_id, motion_text: motion.motion_text, context: motion.context, claim_form: motion.claim_form } : null,
  });
}
