import { DIMENSIONS } from "./categories";
import type { Scores, VerdictTier } from "./types";

/** Delay simulasi "AI sedang menyusun argumen". */
export const fakeDelay = (ms: number) =>
  new Promise<void>((res) => setTimeout(res, ms));

export const uid = () =>
  Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

/** Tanggal "hari ini" (WIB disimulasikan) → yyyy-mm-dd. */
export function todayWIB(): string {
  const now = new Date();
  // geser ke WIB (UTC+7) lalu ambil tanggalnya
  const wib = new Date(now.getTime() + 7 * 3600 * 1000);
  return wib.toISOString().slice(0, 10);
}

export function formatTanggalID(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const bulan = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  return `${d} ${bulan[m - 1]} ${y}`;
}

/** Agregasi berbobot 1..5 → 0..100 + gate relevansi (TRD-05 §3). */
export function aggregate(scores: Scores): number {
  const raw = DIMENSIONS.reduce((sum, d) => sum + d.weight * scores[d.id], 0);
  let total = Math.round(((raw - 1) / 4) * 100);
  if (scores.relevansi <= 2) total = Math.round(total * 0.5); // gate
  return Math.max(0, Math.min(100, total));
}

/** Verdict dari skor (TRD-05 §5) — nol panggilan LLM. */
export function computeVerdict(scores: Scores): VerdictTier {
  const base = 0.5 * scores.responsiveness + 0.5 * scores.penalaran;
  if (base >= 4) return "bertahan";
  if (base >= 2.5) return "imbang";
  return "runtuh";
}

/** Skor total → 10 kotak block-art (untuk share, ala Wordle). */
export function scoreToBlocks(total: number, tier: VerdictTier): string {
  const filledChar =
    tier === "bertahan" ? "🟩" : tier === "imbang" ? "🟨" : "🟥";
  const filled = Math.round(total / 10);
  return filledChar.repeat(filled) + "⬜".repeat(10 - filled);
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));
