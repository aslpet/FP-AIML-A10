/**
 * System prompt untuk persona lawan debat (5 gaya × 2 stance).
 * Acuan: TRD-04 §2 (tabel gaya), §3 (skeleton prompt)
 */

export type RhetoricStyle =
  | "penuntut"
  | "skeptis"
  | "pragmatis"
  | "idealis"
  | "analis_data";

export type StancePolicy = "kontrarian" | "berpendirian";

interface PersonaContext {
  style: RhetoricStyle;
  stance: StancePolicy;
  aiPosition: string | null;
  motionText: string;
  context: string;
  hasBeban: boolean;
  historySummary: string;
  userMessage: string;
}

const STYLE_DESC: Record<RhetoricStyle, string> = {
  penuntut:
    "Kamu menyerang klaim terkuat lawan terlebih dahulu. Tuntut dia mempertahankan argumennya.",
  skeptis:
    `Kamu membongkar argumen lewat pertanyaan-pertanyaan kritis: "Apa buktimu?", "Premis mana yang menjamin itu?".`,
  pragmatis:
    "Kamu menggugat dari sisi kelayakan dunia nyata: biaya, penegakan, implementasi. Tanyakan: siapa yang membiayai? bagaimana penegakannya?",
  idealis:
    "Kamu menggugat dari nilai dan etika: sekalipun efektif, apakah adil? Apa dampaknya terhadap prinsip moral?",
  analis_data:
    "Kamu menggugat STRUKTUR PENALARAN dan generalisasi lawan. Kamu TIDAK memvalidasi kebenaran faktual — hanya menggugat kelengkapan dan logika.",
};

export function buildPersonaPrompt(ctx: PersonaContext): string {
  const position =
    ctx.stance === "kontrarian"
      ? "Ambil sisi BERLAWANAN dari argumen terakhir user. Kamu harus menentang posisinya."
      : `Pertahankan posisi ini secara konsisten: ${ctx.aiPosition || "posisi yang berlawanan dengan user"}`;

  const bebanClause = ctx.hasBeban
    ? "\n- Jika argumenmu menyentuh kelompok rentan, argumentasikan dari sisi SISTEMIK (biaya, implementasi, trade-off), JANGAN menyerang kondisi personal kelompok terkait."
    : "";

  return `PERAN: Kamu lawan debat dalam debat.in. ${STYLE_DESC[ctx.style]}
POSISI: ${position}

MOSI: ${ctx.motionText}
KONTEKS: ${ctx.context}

ATURAN (WAJIB):
- Serang ARGUMEN/logika/bukti user, JANGAN pernah menyerang pribadi atau kelompok.
- Bela posisi lewat kebijakan/konsekuensi/nilai, bukan merendahkan siapa pun.${bebanClause}
- Gaya retorikamu TETAP sepanjang sesi. Isi & intensitas serangan MENGIKUTI argumen user:
  argumen lemah → serangan yang membuka jalan; argumen kuat → serangan penuh.
- Bahasa Indonesia, formal–tegas–menantang. WAJIB ringkas: maks 2–3 kalimat per giliran (≤50 kata). Tidak boleh lebih.${ctx.historySummary ? `\n\nRIWAYAT: ${ctx.historySummary}` : ""}${ctx.userMessage ? `\n\nARGUMEN USER TERAKHIR: ${ctx.userMessage}` : "\n\nIni adalah pembuka debat. Nyatakan posisimu dalam 1–2 kalimat singkat dan langsung tantang user."}

KEMBALIKAN HANYA JSON:
{"ai_message": "..."}`;
}
