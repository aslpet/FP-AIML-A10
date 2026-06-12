import { admin } from "@/lib/supabase/admin";
import { todayWIB, daysAgoWIB } from "@/lib/date";
import { config } from "@/lib/config";
import { ALL_CATEGORIES, type CategoryId } from "./types";

/**
 * Rotasi kategori harian: pilih 4 dari 5 dengan pagar absen-2-hari.
 * Acuan: TRD-02 §3
 */
export async function rotateCategories(): Promise<CategoryId[]> {
  const today = todayWIB();
  const since = daysAgoWIB(7);

  // Ambil riwayat status live per kategori N hari terakhir
  const { data: recentMotions } = await admin()
    .from("daily_motion")
    .select("category, live_date")
    .eq("status", "live")
    .gte("live_date", since)
    .order("live_date", { ascending: false });

  // Hitung hari sejak terakhir aktif per kategori
  const lastActive: Record<string, string | null> = {};
  for (const cat of ALL_CATEGORIES) {
    const dates = (recentMotions ?? [])
      .filter((m) => m.category === cat)
      .map((m) => m.live_date);
    lastActive[cat] = dates.length > 0 ? dates[0] : null;
  }

  const daysSinceActive = (cat: CategoryId): number => {
    const d = lastActive[cat];
    if (!d) return 999;
    const last = new Date(d + "T00:00:00+07:00");
    const now = new Date(today + "T00:00:00+07:00");
    return Math.floor((now.getTime() - last.getTime()) / 86400000);
  };

  const target = config.pipeline.activeCategories; // 4
  const selected: CategoryId[] = [];

  // Pagar keadilan: WAJIB sertakan kategori yang absen ≥2 hari (FR-3)
  const mustInclude = ALL_CATEGORIES.filter((c) => daysSinceActive(c) >= 2);

  for (const cat of mustInclude) {
    if (selected.length < target) {
      selected.push(cat);
    }
  }

  // Sisa slot diisi acak dari kategori yang belum terpilih
  const remaining = ALL_CATEGORIES.filter((c) => !selected.includes(c));
  const shuffled = remaining.sort(() => Math.random() - 0.5);

  for (const cat of shuffled) {
    if (selected.length >= target) break;
    selected.push(cat);
  }

  return selected;
}
