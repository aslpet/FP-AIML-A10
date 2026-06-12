/**
 * Pure functions untuk agregasi skor, gate relevansi, dan verdict.
 * Acuan: TRD-05 §3 (agregasi & gate), TRD-05 §5 (verdict)
 */

export interface DimensionScores {
  penalaran: number; // 1–5
  relevansi: number;
  responsiveness: number;
  kejelasan: number;
}

export type VerdictTier = "Argumen Bertahan" | "Imbang Ketat" | "Argumen Runtuh";

const WEIGHTS = {
  penalaran: 0.35,
  relevansi: 0.25,
  responsiveness: 0.25,
  kejelasan: 0.15,
} as const;

/**
 * Agregasi skor 4 dimensi (1–5) → 0–100.
 * Menerapkan gate relevansi: jika Relevansi ≤ 2, total di-cap ×0.5.
 * Acuan: TRD-05 §3
 */
export function aggregate(scores: DimensionScores): number {
  const raw =
    WEIGHTS.penalaran * scores.penalaran +
    WEIGHTS.relevansi * scores.relevansi +
    WEIGHTS.responsiveness * scores.responsiveness +
    WEIGHTS.kejelasan * scores.kejelasan;

  // Rescale 1..5 → 0..100
  let total = Math.round(((raw - 1) / 4) * 100);
  total = clamp(total, 0, 100);

  // Gate relevansi (FR-39)
  if (scores.relevansi <= 2) {
    total = Math.round(total * 0.5);
  }

  return total;
}

/**
 * Verdict 3 tingkat dari skor yang sudah ada.
 * base = 0.5 × Responsiveness + 0.5 × Penalaran
 * Acuan: TRD-05 §5
 */
export function computeVerdict(scores: DimensionScores): VerdictTier {
  const base = 0.5 * scores.responsiveness + 0.5 * scores.penalaran;
  if (base >= 4) return "Argumen Bertahan";
  if (base >= 2.5) return "Imbang Ketat";
  return "Argumen Runtuh";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
