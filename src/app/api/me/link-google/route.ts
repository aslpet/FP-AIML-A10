import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dipanggil setelah user berhasil link Google OAuth via Supabase.
 * Update is_anonymous = false. uid tetap, progres terbawa.
 * Acuan: TRD-06 §1.2, Implementation Plan M4
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Login required" } }, { status: 401 });

  if (user.is_anonymous) {
    return NextResponse.json({ error: { code: "NOT_LINKED", message: "Google account not yet linked" } }, { status: 400 });
  }

  await admin()
    .from("app_user")
    .upsert({ uid: user.id, is_anonymous: false });

  return NextResponse.json({ ok: true, is_anonymous: false });
}
