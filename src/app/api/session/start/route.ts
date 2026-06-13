import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startSession } from "@/lib/session/engine";
import { getOrAssignCategory } from "@/lib/session/assignment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });

  const uid = user.id;
  const body = await request.json();
  const category = body?.category || await getOrAssignCategory(uid);

  try {
    const { sessionId, aiMessage } = await startSession(uid, category);
    return NextResponse.json({ session_id: sessionId, ai_message: aiMessage, current_round: 0 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: { code: "SESSION_ERROR", message: msg } }, { status: 500 });
  }
}
