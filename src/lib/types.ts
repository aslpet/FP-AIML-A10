// Tipe data inti prototype — selaras dengan skema produk (TRD-01) tetapi disederhanakan.

export type CategoryId =
  | "politik_hukum"
  | "ekonomi"
  | "teknologi"
  | "sosial_pendidikan"
  | "lingkungan";

export type ClaimForm = "kebijakan" | "fakta" | "nilai";

export type DimensionId =
  | "penalaran"
  | "relevansi"
  | "responsiveness"
  | "kejelasan";

export type VerdictTier = "bertahan" | "imbang" | "runtuh";

export interface Motion {
  motion_id: string;
  category: CategoryId;
  claim_form: ClaimForm;
  motion_text: string;
  context: string;
  source_title: string;
  source_outlet: string;
}

/** Satu giliran dalam transkrip arena. round 0 = pembuka AI. */
export interface Turn {
  role: "ai" | "user";
  content: string;
  round: number;
}

/** Skrip AI kalengan untuk satu mosi (simulasi, tanpa LLM). */
export interface DebateScript {
  motion_id?: string; // opsional: key map sudah = motion_id
  opening: string; // ronde 0
  rebuttals: [string, string]; // tanggapan ronde 1 & 2 (tanpa skor)
  closing: string; // penutup ronde 3
}

export type Scores = Record<DimensionId, number>; // 1..5

export interface SessionResult {
  session_id: string;
  play_date: string; // ISO yyyy-mm-dd (WIB disimulasikan)
  category: CategoryId;
  motion_text: string;
  scores: Scores;
  rationale: Record<DimensionId, string>;
  total_score: number; // 0..100
  feedback: string;
  verdict: VerdictTier;
  is_bonus: boolean; // sesi bonus (kategori lanjutan)
}

/** State global prototype yang dipersist di localStorage. */
export interface ProtoState {
  consented: boolean;
  streak: number;
  bestStreak: number;
  totalPlayed: number;
  lastPlayedDate: string | null;
  verdictDist: Record<VerdictTier, number>;
  // Hari ini
  todayDate: string;
  activeCategories: CategoryId[];
  assignedCategory: CategoryId | null; // kategori pertama yang diundi & terkunci
  playedTodayCategories: CategoryId[];
  // Riwayat
  sessions: SessionResult[];
  isAnonymous: boolean;
}
