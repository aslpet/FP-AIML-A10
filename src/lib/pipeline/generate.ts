import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "@/lib/config";
import type { RssArticle, LlmGenerateResponse } from "./types";

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(config.gemini.apiKeyPipeline || config.gemini.apiKey);
  }
  return _genAI;
}

/**
 * Panggil LLM untuk: Gerbang 1 → generate kandidat mosi → skor → Gerbang 2.
 * Satu panggilan LLM mencakup semuanya.
 * Retry-with-backoff untuk rate limit (NFR-14, TRD-00 §5).
 * Acuan: TRD-02 §5, TRD-03 §2–5
 */
export async function generateCandidates(
  article: RssArticle,
): Promise<LlmGenerateResponse> {
  const model = getGenAI().getGenerativeModel({
    model: config.gemini.modelPipeline,
    generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
  });

  const prompt = buildGeneratePrompt(article);

  const MAX_RETRIES = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return parseResponse(text);
    } catch (err) {
      lastError = err;
      const retryDelay = extractRetryDelay(err);

      if (retryDelay && retryDelay >= 1000 && attempt < MAX_RETRIES) {
        console.warn(
          `[generate] Rate limited (RPM), retrying in ${(retryDelay / 1000).toFixed(1)}s (attempt ${attempt + 1}/${MAX_RETRIES})`,
        );
        await sleep(retryDelay);
        continue;
      }

      // retryDelay < 1s = daily quota habis (RPD), percuma retry
      if (retryDelay && retryDelay < 1000) {
        console.error(`[generate] Daily quota exhausted (RPD), skipping retry`);
      }

      // Non-retryable error, atau sudah habis retry
      if (attempt >= MAX_RETRIES) {
        console.error(`[generate] Failed after ${MAX_RETRIES} retries`);
      }
      throw err;
    }
  }

  throw lastError;
}

function buildGeneratePrompt(article: RssArticle): string {
  return `Kamu kurator mosi debat berbahasa Indonesia untuk aplikasi pelatihan argumentasi.

Dari artikel berikut, lakukan langkah-langkah ini:

1. Tentukan apakah artikel DEBATABLE (punya dua sisi yang bisa diperdebatkan).
   Jika tidak → {"candidates":[],"reject":"non_debatable"}

2. Periksa apakah artikel menyangkut PERKARA HUKUM dengan NAMA individu yang BELUM divonis.
   Jika ya → {"candidates":[],"reject":"named_legal"}

3. Hasilkan SAMPAI 3 kandidat mosi debat lintas bentuk klaim (kebijakan/fakta/nilai).
   Tiap kandidat HARUS memiliki:
   - motion_text: proposisi debat yang jelas dan spesifik
   - context: 1–2 kalimat latar NETRAL (tidak memihak)
   - claim_form: "kebijakan" | "fakta" | "nilai"

4. Untuk TIAP kandidat, jalankan TES MARTABAT:
   a. OBJEK: yang diperdebatkan harus kebijakan/institusi/ide, BUKAN kelayakan/keberadaan
      kelompok manusia. Jika objek = kelompok → coba REFRAME (geser ke kebijakan/institusi).
   b. ARAH: mendebatkan "cara memperlakukan" → lolos; mendebatkan "apakah kelompok berhak" → gagal → reframe.
   c. BEBAN: jika mosi menyentuh kondisi personal kelompok rentan → set flags.beban=true.
      Ini FLAG, BUKAN alasan membuang mosi.
   d. REFRAME-FIRST: kandidat yang gagal (a) atau (b) JANGAN langsung dibuang —
      tulis ulang framing-nya dulu. Jika reframe lolos → pakai versi reframed (flags.reframed=true).
      Jika reframe tetap gagal → tandai reject.
   e. TRAGEDI: jika mosi menjadikan PENDERITAAN KORBAN sebagai objek → reject (kapan pun).
      Jika mosi berobjek KEBIJAKAN yang lahir dari tragedi → lolos (kapan pun, tanpa batasan waktu).

5. Beri quality_score 0–100 untuk tiap kandidat berdasarkan:
   - Keseimbangan dua sisi (apakah kedua pihak punya argumen valid?)
   - Aksesibilitas (apakah bisa dinalar orang awam tanpa pengetahuan spesialis?)
   - Kejelasan proposisi (apakah cukup spesifik untuk dinilai Relevansinya?)
   - Daya cengkeram (apakah menarik untuk diperdebatkan?)

6. Tolak kandidat dengan PREMIS LICIK — framing yang menyelipkan penghakiman terhadap
   kelompok di premisnya (mis. "...karena bikin masyarakat malas").

ARTIKEL:
Judul: ${article.title}
Ringkasan: ${article.summary}
Tanggal: ${article.published.toISOString().slice(0, 10)}

KEMBALIKAN HANYA JSON, tanpa teks lain:
{
  "candidates": [
    {
      "motion_text": "...",
      "context": "...",
      "claim_form": "kebijakan",
      "quality_score": 85,
      "flags": { "beban": false, "reframed": false },
      "reject": null
    }
  ]
}`;
}

function extractRetryDelay(err: unknown): number | null {
  if (err && typeof err === "object" && "status" in err) {
    const status = (err as { status: number }).status;
    if (status === 429) {
      // Coba ambil retryDelay dari Gemini error payload
      const details = (err as { errorDetails?: Array<{ retryDelay?: string }> }).errorDetails;
      if (details) {
        for (const d of details) {
          if (d.retryDelay) {
            const seconds = parseFloat(d.retryDelay.replace("s", ""));
            if (!isNaN(seconds)) return Math.ceil(seconds * 1000);
          }
        }
      }
      // Default backoff: 2^attempt seconds
      return 2000;
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseResponse(text: string): LlmGenerateResponse {
  const raw = text.trim();
  console.log("[generate] Raw response (first 500 chars):", raw.slice(0, 500));

  // Strategy 1: strip semua markdown fence + whitespace
  let cleaned = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  // Strategy 2: kalau masih ada fence di tengah, coba ekstrak JSON object
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const match = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) cleaned = match[0];
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return { candidates: parsed };
    }
    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.candidates)) {
        return { candidates: parsed.candidates };
      }
      // Response punya reject di top-level tanpa kandidat
      if (parsed.reject) {
        console.log(`[generate] Article rejected: ${parsed.reject}`);
        return { candidates: [] };
      }
    }
  } catch {
    console.warn("[generate] JSON parse failed, last 100 chars:", cleaned.slice(-100));
    return { candidates: [] };
  }

  return { candidates: [] };
}
