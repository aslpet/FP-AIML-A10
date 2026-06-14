import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/debate
 * Body: { motionText, context, userMessage?, history? }
 * Returns: { ai_message: string }
 *
 * Memanggil Gemini sebagai persona lawan debat.
 * Prompt diambil dari TRD-04 (persona.ts di proyek utama).
 */

function buildPrompt(body: {
  motionText: string;
  context: string;
  userMessage?: string;
  history?: string;
}): string {
  const hasUser = !!body.userMessage;

  return `PERAN: Kamu lawan debat dalam debat.in. Kamu menyerang klaim terkuat lawan. Tuntut dia mempertahankan argumennya.
POSISI: Ambil sisi BERLAWANAN dari argumen terakhir user. Kamu harus menentang posisinya.

MOSI: ${body.motionText}
KONTEKS: ${body.context}

ATURAN (WAJIB):
- Serang ARGUMEN/logika/bukti user, JANGAN pernah menyerang pribadi atau kelompok.
- Bela posisi lewat kebijakan/konsekuensi/nilai, bukan merendahkan siapa pun.
- Gaya retorikamu TETAP sepanjang sesi: formal, tegas, menantang.
- Isi & intensitas serangan MENGIKUTI argumen user: argumen lemah → serangan yang membuka jalan; argumen kuat → serangan penuh.
- Bahasa Indonesia, formal–tegas–menantang. Berikan sanggahan yang komprehensif dan tajam (sekitar 50-100 kata per giliran).
- JANGAN gunakan format bullet point, list, atau markdown. Tulis dalam paragraf mengalir.${body.history ? `\n\nRIWAYAT DEBAT:\n${body.history}` : ""}${hasUser ? `\n\nARGUMEN USER TERAKHIR: ${body.userMessage}` : "\n\nIni adalah pembuka debat. Nyatakan posisimu dengan tegas dan tantang user untuk berargumen."}

KEMBALIKAN HANYA JSON:
{"ai_message": "..."}`;
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
    const { motionText, context } = body;

    if (!motionText) {
      return NextResponse.json(
        { error: "motionText wajib diisi" },
        { status: 400 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
      generationConfig: {
        temperature: 0.8,
        responseMimeType: "application/json",
      },
    });

    const prompt = buildPrompt({ motionText, context, ...body });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log("[api/debate] RAW GEMINI TEXT:", text);

    // Parse JSON response
    let parsed: { ai_message: string };
    try {
      let cleaned = text.trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        cleaned = match[0];
      }
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: jika Gemini terpotong di tengah jalan (misal karena token limit atau error)
      let fallbackText = text.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
      // Bersihkan awalan JSON seperti { "ai_message": "
      fallbackText = fallbackText.replace(/^\{?\s*"ai_message"\s*:\s*"/i, "");
      // Bersihkan akhiran jika ada sisa tanda kutip
      fallbackText = fallbackText.replace(/["}\s]*$/g, "");
      
      parsed = { ai_message: fallbackText.trim() + "..." };
    }

    return NextResponse.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/debate]", message);
    return NextResponse.json(
      { error: message, ai_message: "Maaf, AI gagal merespons. Coba lagi." },
      { status: 500 },
    );
  }
}
