import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });

  await supabase
    .from("app_user")
    .upsert({ uid: user.id, consent_at: new Date().toISOString(), is_anonymous: user.is_anonymous ?? true });

  return NextResponse.json({ ok: true });
}
