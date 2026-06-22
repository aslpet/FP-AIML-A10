export async function register() {
  // Only run in Node.js runtime (not Edge), and only on the server
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // On Vercel (serverless) there is no persistent process to keep node-cron
  // alive, and register() runs on every cold start. Rely on the Vercel Cron Job
  // (vercel.json → /api/cron/daily) instead. This in-app scheduler is only for
  // local dev / self-hosted (long-running) deployments.
  if (process.env.VERCEL) return;

  const { runDailyPipeline } = await import("@/lib/pipeline");
  const { todayWIB } = await import("@/lib/date");
  const { admin } = await import("@/lib/supabase/admin");

  async function todayMotionExists(): Promise<boolean> {
    try {
      const supabase = admin();
      const { count } = await supabase
        .from("daily_motion")
        .select("*", { count: "exact", head: true })
        .eq("live_date", todayWIB());
      return (count ?? 0) > 0;
    } catch {
      return false;
    }
  }

  async function generateIfNeeded() {
    if (await todayMotionExists()) return;
    console.log("[cron] Mosi hari ini belum ada, menjalankan pipeline...");
    try {
      const results = await runDailyPipeline();
      const summary = Object.fromEntries(results.map((r) => [r.category, r.error ?? r.source]));
      console.log("[cron] Pipeline selesai:", summary);
    } catch (e) {
      console.error("[cron] Pipeline gagal:", e);
    }
  }

  // Run immediately on startup
  generateIfNeeded();

  // Schedule every day at 00:00 WIB (17:00 UTC)
  const cron = await import("node-cron");
  cron.schedule("0 17 * * *", () => {
    console.log("[cron] Menjalankan pipeline harian...");
    generateIfNeeded();
  }, { timezone: "UTC" });

  console.log("[cron] Scheduler aktif — pipeline berjalan tiap 00:00 WIB");
}
