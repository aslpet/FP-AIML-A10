import { NextResponse } from "next/server";
import { config } from "@/lib/config";
import { runDailyPipeline } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const vercelCron = request.headers.get("x-vercel-cron-secret");
  const expected = `Bearer ${config.cronSecret}`;

  // Menerima Authorization header (curl/manual) ATAU x-vercel-cron-secret (Vercel Cron)
  const authorized =
    (config.cronSecret && auth === expected) ||
    (config.cronSecret && vercelCron === config.cronSecret);

  if (!authorized) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Invalid or missing CRON_SECRET" } },
      { status: 401 },
    );
  }

  try {
    const startTime = Date.now();
    const results = await runDailyPipeline();
    const duration = Date.now() - startTime;

    const summary: Record<string, string> = {};
    for (const r of results) {
      summary[r.category] = r.error ? `FAILED: ${r.error}` : r.source;
    }

    return NextResponse.json({ ran: true, summary, duration_ms: duration });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/daily] Fatal error:", msg);
    return NextResponse.json(
      { error: { code: "PIPELINE_ERROR", message: msg } },
      { status: 500 },
    );
  }
}
