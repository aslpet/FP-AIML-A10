import { admin } from "@/lib/supabase/admin";
import { todayWIB } from "@/lib/date";
import type {
  CategoryId,
  StancePolicy,
  RhetoricStyle,
  ClaimForm,
} from "./types";
import { STANCE_POLICIES, RHETORIC_STYLES } from "./types";

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface PromotionResult {
  motionId: string;
  personaStance: StancePolicy;
  personaStyle: RhetoricStyle;
  aiPosition: string | null;
}

/**
 * Promote mosi ke status=live. Undi persona + tentukan ai_position.
 * FUNGSI TUNGGAL — dipanggil dari jalur fresh, queue, dan fallback.
 * Acuan: TRD-02 §5, TRD-04 §2, temuan #3
 */
export async function promote(
  motionId: string,
  _category: CategoryId,
): Promise<PromotionResult> {
  const today = todayWIB();

  // Undi persona
  const stance = randomPick(STANCE_POLICIES);
  const style = randomPick(RHETORIC_STYLES);

  // Cek beban flag — jika true dan stance berpendirian, pilih posisi aman
  const { data: motion } = await admin()
    .from("daily_motion")
    .select("safety_flags, motion_text")
    .eq("motion_id", motionId)
    .single();

  const flags = (motion?.safety_flags ?? {}) as Record<string, unknown>;
  const motionText = motion?.motion_text ?? "";
  const hasBeban = flags.beban === true;
  let aiPosition: string | null = null;

  if (stance === "berpendirian") {
    const side = randomPick(["Mendukung", "Menolak"]);
    aiPosition = hasBeban
      ? `${side} mosi ini dari sisi sistemik (biaya/implementasi/trade-off), tanpa menyerang kondisi personal kelompok terkait. Mosi: "${motionText}"`
      : `${side} mosi ini. Mosi: "${motionText}"`;
  }

  // Update mosi jadi live dengan persona
  const { error } = await admin()
    .from("daily_motion")
    .update({
      status: "live",
      live_date: today,
      persona_stance: stance,
      persona_style: style,
      ai_position: aiPosition,
    })
    .eq("motion_id", motionId);

  if (error) {
    throw new Error(`Failed to promote motion ${motionId}: ${error.message}`);
  }

  return { motionId, personaStance: stance, personaStyle: style, aiPosition };
}

/**
 * Tie-break: pilih kandidat tertinggi yang claim_form-nya beda dari mosi live kemarin.
 */
export async function pickBestCandidate(
  candidateIds: string[],
  category: CategoryId,
  yesterdayClaimForm?: ClaimForm,
): Promise<string | null> {
  const { data: candidates } = await admin()
    .from("daily_motion")
    .select("motion_id, claim_form, quality_score")
    .in("motion_id", candidateIds)
    .order("quality_score", { ascending: false });

  if (!candidates || candidates.length === 0) return null;

  // Prioritaskan yang claim_form beda dari kemarin
  const preferred = candidates.find(
    (c) => c.claim_form !== yesterdayClaimForm,
  );
  return preferred?.motion_id ?? candidates[0].motion_id;
}
