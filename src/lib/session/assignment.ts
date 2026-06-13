import { admin } from "@/lib/supabase/admin";
import { todayWIB } from "@/lib/date";
import type { CategoryId } from "@/lib/pipeline/types";

/**
 * Assignment kategori — server-side, anti-reroll.
 * Acuan: TRD-04 §1
 */

export async function getOrAssignCategory(
  uid: string,
): Promise<CategoryId> {
  const today = todayWIB();

  // Cek assignment yang sudah ada
  const { data: existing } = await admin()
    .from("assignment")
    .select("category")
    .eq("uid", uid)
    .eq("play_date", today)
    .maybeSingle();

  if (existing) return existing.category as CategoryId;

  // Cari kategori aktif yang BELUM dimainkan user hari ini
  const { data: playedSessions } = await admin()
    .from("session")
    .select("category")
    .eq("uid", uid)
    .eq("play_date", today);

  const playedCategories = (playedSessions ?? []).map((s) => s.category);

  const { data: liveMotions } = await admin()
    .from("daily_motion")
    .select("category")
    .eq("status", "live")
    .eq("live_date", today);

  const activeCategories = (liveMotions ?? [])
    .map((m) => m.category as CategoryId)
    .filter((c) => !playedCategories.includes(c));

  if (activeCategories.length === 0) {
    throw new Error("No available categories today");
  }

  const chosen = activeCategories[Math.floor(Math.random() * activeCategories.length)];

  const { error } = await admin()
    .from("assignment")
    .upsert({ uid, play_date: today, category: chosen }, { onConflict: "uid,play_date" });

  // Jika concurrent request sudah insert → ambil nilai yang sudah ada
  if (error) {
    const { data: existing } = await admin()
      .from("assignment")
      .select("category")
      .eq("uid", uid)
      .eq("play_date", today)
      .single();
    return (existing?.category ?? chosen) as CategoryId;
  }

  return chosen;
}

export async function getNextCategory(
  uid: string,
): Promise<CategoryId | null> {
  const today = todayWIB();

  const { data: playedSessions } = await admin()
    .from("session")
    .select("category")
    .eq("uid", uid)
    .eq("play_date", today);

  const playedCategories = (playedSessions ?? []).map((s) => s.category);

  const { data: liveMotions } = await admin()
    .from("daily_motion")
    .select("category")
    .eq("status", "live")
    .eq("live_date", today);

  const available = (liveMotions ?? [])
    .map((m) => m.category as CategoryId)
    .filter((c) => !playedCategories.includes(c));

  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}
