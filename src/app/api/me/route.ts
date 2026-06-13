import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });

  const { data: appUser } = await supabase
    .from("app_user")
    .select("is_anonymous, streak_count, last_played_date, consent_at")
    .eq("uid", user.id)
    .maybeSingle();

  return NextResponse.json({
    uid: user.id,
    is_anonymous: appUser?.is_anonymous ?? true,
    streak_count: appUser?.streak_count ?? 0,
    last_played_date: appUser?.last_played_date ?? null,
    consent: !!appUser?.consent_at,
  });
}
