import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/evaluate
 * Body: { motionText, context, userArgs: [string, string, string], aiSummary: string }
 * Returns: { penalaran, relevansi, responsiveness, kejelasan, rationale: {...}, feedback }
 *
 * Memanggil Gemini sebagai evaluator juri netral.
 * Prompt diambil dari TRD-05 (evaluator.ts di proyek utama).
 */

const ANCHORS = {
  penalaran:
    "1=gagal total, 2=lemah, 3=memadai, 4=kuat (logis + contoh), 5=sangat kuat (logika ketat, bukti kuat)",
  relevansi:
    "1=tidak nyambung, 2=sedikit nyambung, 3=cukup relevan, 4=mayoritas relevan, 5=seluruh argumen tepat sasaran",
  responsiveness:
    "1=tidak merespons sanggahan, 2=menyinggung tapi tidak menjawab, 3=menjawab sebagian, 4=menjawab dengan baik, 5=sangat tanggap",
  kejelasan:
    "1=kacau, 2=sulit dipahami, 3=cukup jelas, 4=jelas dan terstruktur, 5=sangat jelas dan eksplisit",
};

function buildEvaluatorPrompt(body: {
  motionText: string;
  context: string;
  userArgs: [string, string, string];
  aiSummary: string;
}): string {
  return `PERAN: Kamu juri argumentasi NETRAL berbahasa Indonesia. Nilai HANYA argumen user terhadap mosi & sanggahan lawan. Kamu TIDAK memihak sisi mana pun.

MOSI: ${body.motionText}
KONTEKS: ${body.context}

ARGUMEN USER (Ronde 1): ${body.userArgs[0]}
ARGUMEN USER (Ronde 2): ${body.userArgs[1]}
ARGUMEN USER (Ronde 3): ${body.userArgs[2]}

RINGKAS SANGGAHAN LAWAN: ${body.aiSummary}

Nilai 4 dimensi, skala 1–5. GUNAKAN RENTANG PENUH — jangan semua menumpuk di 3–4:
- penalaran: ${ANCHORS.penalaran}
- relevansi: ${ANCHORS.relevansi}
- responsiveness: ${ANCHORS.responsiveness}
- kejelasan: ${ANCHORS.kejelasan}

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

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum diatur di .env.local" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { motionText, context, userArgs, aiSummary } = body;

    if (!motionText || !userArgs || userArgs.length < 3) {
      return NextResponse.json(
        { error: "motionText dan userArgs (3 ronde) wajib diisi" },
        { status: 400 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    });

    const prompt = buildEvaluatorPrompt({
      motionText,
      context,
      userArgs,
      aiSummary: aiSummary || "",
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON
    let parsed;
    try {
      let cleaned = text.trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        cleaned = match[0];
      }
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[api/evaluate] JSON parse failed:", text.slice(-200));
      return NextResponse.json(
        { error: "Gagal mem-parse respons evaluator" },
        { status: 500 },
      );
    }

    // Validate and clamp scores 1-5
    const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n || 3)));
    const scores = {
      penalaran: clamp(parsed.penalaran),
      relevansi: clamp(parsed.relevansi),
      responsiveness: clamp(parsed.responsiveness),
      kejelasan: clamp(parsed.kejelasan),
    };

    return NextResponse.json({
      ...scores,
      rationale: parsed.rationale || {
        penalaran: "—",
        relevansi: "—",
        responsiveness: "—",
        kejelasan: "—",
      },
      feedback:
        parsed.feedback ||
        "Evaluasi selesai. Terus asah argumenmu di sesi berikutnya.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/evaluate]", message);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
