import { admin } from "@/lib/supabase/admin";
import { todayWIB, yesterdayWIB } from "@/lib/date";
import { rotateCategories } from "./rotation";
import { ingestCategory, hashSourceId } from "./rss";
import { generateCandidates } from "./generate";
import { promote, pickBestCandidate } from "./promote";
import { takeFromQueue, housekeepQueue } from "./queue";
import { insertFallbackMotion } from "./fallback";
import type {
  CategoryId,
  PipelineResult,
  ClaimForm,
} from "./types";

/**
 * Pipeline harian utama. Dipanggil dari cron endpoint.
 * Idempoten per (tanggal, kategori) — aman dipanggil 2×.
 * Acuan: TRD-02 §2 (alur utama), §9 (idempotensi & error)
 */
export async function runDailyPipeline(): Promise<PipelineResult[]> {
  const today = todayWIB();
  const results: PipelineResult[] = [];

  // 1. Rotasi: tentukan kategori aktif hari ini
  const activeCategories = await rotateCategories();
  console.log("[pipeline] Active categories:", activeCategories);

  for (const category of activeCategories) {
    const catStart = Date.now();
    try {
      const result = await processCategory(category, today);
      results.push(result);
      console.log(
        `[pipeline] ${category}: ${result.source} → ${result.motion_id ?? "FAILED"} (${Date.now() - catStart}ms)`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[pipeline] ${category}: ERROR — ${msg}`);
      results.push({ category, source: "fresh", motion_id: null, error: msg });
    }
  }

  // 2. Housekeeping: retire mosi antrian kadaluarsa
  const retired = await housekeepQueue();
  if (retired > 0) {
    console.log(`[pipeline] Housekeeping: ${retired} expired queue items retired`);
  }

  return results;
}

async function processCategory(
  category: CategoryId,
  today: string,
): Promise<PipelineResult> {
  // Idempotensi: cek apakah sudah ada mosi live untuk (category, today)
  const { data: existing } = await admin()
    .from("daily_motion")
    .select("motion_id, source_outlet")
    .eq("category", category)
    .eq("status", "live")
    .eq("live_date", today)
    .maybeSingle();

  if (existing) {
    console.log(`[pipeline] ${category}: already live — skipping (idempotent)`);
    return {
      category,
      source: existing.source_outlet === "static_fallback" ? "fallback" : "fresh",
      motion_id: existing.motion_id,
    };
  }

  // Ambil claim_form mosi live kemarin untuk tie-break (TRD-02 §5)
  const yesterday = yesterdayWIB(today);
  const { data: yesterdayMotion } = await admin()
    .from("daily_motion")
    .select("claim_form")
    .eq("category", category)
    .eq("status", "live")
    .eq("live_date", yesterday)
    .maybeSingle();
  const yesterdayClaimForm = yesterdayMotion?.claim_form as ClaimForm | undefined;

  // --- Jalur 1: Fresh dari RSS ---
  try {
    const articles = await ingestCategory(category);
    console.log(`[pipeline] ${category}: ${articles.length} RSS articles`);

    if (articles.length > 0) {
      // Pilih 1 berita (paling atas = terbaru, TRD-02 §2c)
      // Gate 1 + generate + rank + Gate 2 = SATU panggilan LLM (TRD-02 §2d)
      const article = articles[0];
      const { candidates } = await generateCandidates(article);
      const valid = candidates.filter((c) => !c.reject);
      console.log(`[pipeline] ${category}: ${candidates.length} candidates (${valid.length} lolos)`);

      if (valid.length > 0) {
        const sourceId = hashSourceId(article.url);
        const insertedIds: string[] = [];

        for (const c of valid) {
          const { data } = await admin()
            .from("daily_motion")
            .insert({
              motion_text: c.motion_text,
              context: c.context,
              claim_form: c.claim_form,
              category,
              source_title: article.title,
              source_url: article.url,
              source_outlet: "RSS",
              source_date: article.published.toISOString().slice(0, 10),
              source_id: sourceId,
              status: "candidate",
              quality_score: c.quality_score,
              safety_flags: c.flags,
              persona_stance: "kontrarian",
              persona_style: "skeptis",
            })
            .select("motion_id")
            .single();

          if (data) insertedIds.push(data.motion_id);
        }

        if (insertedIds.length > 0) {
          const bestId = await pickBestCandidate(insertedIds, category, yesterdayClaimForm);
          if (bestId) {
            await promote(bestId, category);

            const queued = insertedIds.filter((id) => id !== bestId);
            if (queued.length > 0) {
              await admin()
                .from("daily_motion")
                .update({ status: "queued" })
                .in("motion_id", queued);
            }

            return { category, source: "fresh", motion_id: bestId };
          }
        }
      }
      // Artikel tidak debatable / semua kandidat ditolak → lanjut ke jalur 2 (antrian)
    }
  } catch (err) {
    console.warn(`[pipeline] ${category}: fresh path failed, trying queue`, err);
  }

  // --- Jalur 2: Antrian (LIFO, TTL 3 hari) ---
  const queuedId = await takeFromQueue(category);
  if (queuedId) {
    await promote(queuedId, category);
    return { category, source: "queue", motion_id: queuedId };
  }

  // --- Jalur 3: Fallback statis ---
  const fallbackId = await insertFallbackMotion(category);
  if (fallbackId) {
    await promote(fallbackId, category);
    return { category, source: "fallback", motion_id: fallbackId };
  }

  return { category, source: "fallback", motion_id: null, error: "All paths exhausted" };
}
