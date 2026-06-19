/**
 * System prompt untuk evaluator juri.
 * TERPISAH & NETRAL dari persona — tidak tahu posisi AI.
 * Acuan: TRD-05 §1 (pemisahan), §2 (dimensi), §4 (skeleton prompt)
 */

interface EvaluatorContext {
  motionText: string;
  context: string;
  userArgs: [string, string, string]; // ronde 1, 2, 3
  aiSummary: string;
}

const ANCHORS = {
  penalaran:
    "1=gagal total (tidak ada klaim/logika), 2=lemah (klaim tidak jelas/alur tidak logis), 3=memadai (klaim jelas, alur masuk akal), 4=baik & solid (klaim jelas, alur logis, ditopang alasan), 5=kuat & meyakinkan (logika nyambung dan argumennya menutup celah — TIDAK harus sempurna atau penuh contoh)",
  relevansi:
    "1=sama sekali tidak nyambung ke mosi, 2=sedikit nyambung tapi mayoritas melenceng, 3=cukup relevan walau ada bagian kurang fokus, 4=sebagian besar relevan dan fokus ke mosi, 5=fokus & tepat sasaran ke mosi (boleh ada sedikit bagian sampingan)",
  responsiveness:
    "1=tidak merespons sanggahan sama sekali, 2=menyinggung tapi tidak menjawab, 3=menjawab sebagian sanggahan, 4=menjawab sanggahan dengan baik, 5=tanggap — menjawab inti sanggahan dengan tepat (TIDAK harus membalas tiap detail)",
  kejelasan:
    "1=tidak terbaca/kacau, 2=sulit dipahami, banyak kalimat tidak terstruktur, 3=cukup jelas walau ada bagian membingungkan, 4=jelas, terstruktur, mudah dipahami, 5=jelas & mudah diikuti (alur argumen gampang ditangkap)",
};

export function buildEvaluatorPrompt(ctx: EvaluatorContext): string {
  return `PERAN: Kamu juri argumentasi NETRAL berbahasa Indonesia. Nilai HANYA argumen user terhadap mosi & sanggahan lawan. Kamu TIDAK memihak sisi mana pun.

MOSI: ${ctx.motionText}
KONTEKS: ${ctx.context}

ARGUMEN USER (Ronde 1): ${ctx.userArgs[0]}
ARGUMEN USER (Ronde 2): ${ctx.userArgs[1]}
ARGUMEN USER (Ronde 3): ${ctx.userArgs[2]}

RINGKAS SANGGAHAN LAWAN: ${ctx.aiSummary}

Nilai 4 dimensi, skala 1–5. GUNAKAN RENTANG PENUH — jangan semua menumpuk di 3–4:
- penalaran: ${ANCHORS.penalaran}
- relevansi: ${ANCHORS.relevansi}
- responsiveness: ${ANCHORS.responsiveness}
- kejelasan: ${ANCHORS.kejelasan}

PRINSIP PENILAIAN: Hargai argumen yang kuat. Beri 5 untuk argumen yang logis, terstruktur,
dan meyakinkan WALAUPUN tidak sempurna — jangan menahan nilai 5 hanya karena bukan kesempurnaan
akademis. Beri 4 untuk argumen yang baik & solid, 3 untuk rata-rata, 2 untuk lemah, 1 untuk sangat
lemah. Adil, jangan pelit ke argumen yang memang bagus, tapi juga jangan memberi nilai tinggi ke
argumen yang dangkal.

Beri rationale 1 kalimat per dimensi + feedback membangun 2–3 kalimat dalam Bahasa Indonesia.

KEMBALIKAN HANYA JSON:
{
  "penalaran": 4,
  "relevansi": 3,
  "responsiveness": 3,
  "kejelasan": 4,
  "rationale": {
    "penalaran": "...",
    "relevansi": "...",
    "responsiveness": "...",
    "kejelasan": "..."
  },
  "feedback": "..."
}`;
}
