import { admin } from "@/lib/supabase/admin";
import { config } from "@/lib/config";
import { todayWIB } from "@/lib/date";
import type { CategoryId } from "./types";

/**
 * Ambil kandidat antrian termuda (LIFO) yang masih hidup untuk kategori tertentu.
 * Acuan: TRD-02 §6
 */
export async function takeFromQueue(
  category: CategoryId,
): Promise<string | null> {
  const ttlDays = config.pipeline.queueTtlDays;
  const cutoff = wibCutoff(ttlDays);

  const { data, error } = await admin()
    .from("daily_motion")
    .select("motion_id")
    .eq("status", "queued")
    .eq("category", category)
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0].motion_id;
}

/**
 * Housekeeping: retire mosi antrian yang melebihi TTL.
 * Dipanggil tiap run pipeline harian.
 * Acuan: TRD-02 §6, §9
 */
export async function housekeepQueue(): Promise<number> {
  const ttlDays = config.pipeline.queueTtlDays;
  const cutoff = wibCutoff(ttlDays);

  const { error, count } = await admin()
    .from("daily_motion")
    .update({ status: "retired" })
    .eq("status", "queued")
    .lt("created_at", cutoff);

  if (error) {
    console.error("[queue] Housekeeping failed:", error.message);
    return 0;
  }

  return count ?? 0;
}

/**
 * Hitung cutoff TTL dalam ISO (WIB-aware).
 * Menggunakan todayWIB agar konsisten dengan seluruh sistem.
 */
function wibCutoff(ttlDays: number): string {
  const d = new Date(todayWIB() + "T00:00:00+07:00");
  d.setDate(d.getDate() - ttlDays);
  return d.toISOString();
}
