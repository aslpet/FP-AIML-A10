import { aggregate, computeVerdict, clamp, uid, todayWIB } from "../util";
import { getMotion } from "./motions";
import type {
  CategoryId,
  DimensionId,
  Scores,
  SessionResult,
} from "../types";

// Baseline skor kalengan per mosi (koheren dengan rationale). Skala 1..5.
const BASELINE: Record<string, Scores> = {
  m_eko_1: { penalaran: 4, relevansi: 4, responsiveness: 3, kejelasan: 4 },
  m_tek_1: { penalaran: 3, relevansi: 4, responsiveness: 3, kejelasan: 4 },
  m_pol_1: { penalaran: 4, relevansi: 3, responsiveness: 4, kejelasan: 3 },
  m_sos_1: { penalaran: 3, relevansi: 4, responsiveness: 3, kejelasan: 3 },
  m_lin_1: { penalaran: 4, relevansi: 4, responsiveness: 4, kejelasan: 3 },
};

const RATIONALE: Record<string, Record<DimensionId, string>> = {
  _default: {
    penalaran:
      "Klaim utama terbaca, namun sebagian alasan masih perlu ditopang contoh konkret.",
    relevansi: "Argumen tetap bergerak di sekitar mosi tanpa melebar jauh.",
    responsiveness:
      "Sebagian sanggahan lawan dijawab, sebagian lain belum ditanggapi langsung.",
    kejelasan: "Struktur cukup runut dan mudah diikuti.",
  },
};

const FEEDBACK = {
  bertahan:
    "Argumenmu berdiri tegak — klaim jelas dan kamu konsisten menjawab serangan. Untuk naik level, tambahkan bukti kuantitatif agar lawan sulit menggoyahkan premismu.",
  imbang:
    "Pertarungan yang seimbang. Penalaranmu solid di beberapa titik, tetapi ada serangan lawan yang belum kamu jawab tuntas. Latih merespons langsung inti sanggahan, bukan sekadar mengulang klaim.",
  runtuh:
    "Lawan menemukan celah pada premis utamamu. Fokus dulu pada satu klaim yang bisa kamu pertahankan penuh, topang dengan alasan, lalu jawab sanggahan secara spesifik.",
} as const;

/** Heuristik effort sederhana: makin substansial argumen user, makin tinggi nudge. */
function effortDelta(userArgs: string[]): number {
  const words = userArgs.join(" ").trim().split(/\s+/).filter(Boolean).length;
  if (words >= 90) return 1;
  if (words >= 40) return 0;
  return -1;
}

export function buildResult(
  motionId: string,
  category: CategoryId,
  userArgs: string[],
  isBonus: boolean,
): SessionResult {
  const base = BASELINE[motionId] ?? {
    penalaran: 3,
    relevansi: 3,
    responsiveness: 3,
    kejelasan: 3,
  };
  const d = effortDelta(userArgs);
  const scores: Scores = {
    penalaran: clamp(base.penalaran + d, 1, 5),
    relevansi: base.relevansi, // dipertahankan agar gate relevansi konsisten
    responsiveness: clamp(base.responsiveness + d, 1, 5),
    kejelasan: clamp(base.kejelasan + (d > 0 ? 1 : 0), 1, 5),
  };
  const total = aggregate(scores);
  const verdict = computeVerdict(scores);
  const motion = getMotion(motionId);

  return {
    session_id: uid(),
    play_date: todayWIB(),
    category,
    motion_text: motion?.motion_text ?? "",
    scores,
    rationale: RATIONALE[motionId] ?? RATIONALE._default,
    total_score: total,
    feedback: FEEDBACK[verdict],
    verdict,
    is_bonus: isBonus,
  };
}
