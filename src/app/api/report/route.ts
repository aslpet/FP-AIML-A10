import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { config } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });

  const body = await request.json();
  const { target_type, motion_id, session_id, reason } = body || {};

  if (!target_type || !motion_id) {
    return NextResponse.json({ error: { code: "INVALID_INPUT", message: "target_type and motion_id required" } }, { status: 400 });
  }

  // Insert laporan (uq_report_unique ensures 1 per user per mosi)
  const { error } = await supabase
    .from("report")
    .insert({
      target_type,
      motion_id,
      session_id: session_id || null,
      uid: user.id,
      reason: reason || null,
    });

  // Domain constraint might fail — idempotent, return ok
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: { code: "REPORT_ERROR", message: error.message } }, { status: 500 });
  }

  // Update report_count dan cek ambang auto-retire
  if (target_type === "motion") {
    const threshold = config.pipeline.reportRetireThreshold;
    const { data: motion } = await admin()
      .from("daily_motion")
      .select("report_count")
      .eq("motion_id", motion_id)
      .single();

    const newCount = (motion?.report_count ?? 0) + 1;

    if (newCount >= threshold) {
      await admin()
        .from("daily_motion")
        .update({ report_count: newCount, status: "retired" })
        .eq("motion_id", motion_id);
    } else {
      await admin()
        .from("daily_motion")
        .update({ report_count: newCount })
        .eq("motion_id", motion_id);
    }
  }

  return NextResponse.json({ ok: true });
}
