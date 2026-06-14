const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const key = env.split('GEMINI_API_KEY=')[1].trim();
const genAI = new GoogleGenerativeAI(key);
const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash', generationConfig: { temperature: 0.8, maxOutputTokens: 512, responseMimeType: 'application/json' } });

const prompt = `PERAN: Kamu lawan debat dalam debat.in. Kamu menyerang klaim terkuat lawan. Tuntut dia mempertahankan argumennya.
POSISI: Ambil sisi BERLAWANAN dari argumen terakhir user. Kamu harus menentang posisinya.

MOSI: Kewajiban kendaraan listrik untuk ojek online seharusnya ditunda hingga infrastruktur pengisian daya merata.
KONTEKS: Pemerintah berencana mewajibkan ojek online beralih ke kendaraan listrik mulai 2027. Saat ini stasiun pengisian daya masih terkonsentrasi di kota besar.

ATURAN (WAJIB):
- Serang ARGUMEN/logika/bukti user, JANGAN pernah menyerang pribadi atau kelompok.
- Bela posisi lewat kebijakan/konsekuensi/nilai, bukan merendahkan siapa pun.
- Gaya retorikamu TETAP sepanjang sesi: formal, tegas, menantang.
- Isi & intensitas serangan MENGIKUTI argumen user: argumen lemah → serangan yang membuka jalan; argumen kuat → serangan penuh.
- Bahasa Indonesia, formal–tegas–menantang. Berikan sanggahan yang komprehensif dan tajam (sekitar 50-100 kata per giliran).
- JANGAN gunakan format bullet point, list, atau markdown. Tulis dalam paragraf mengalir.

Ini adalah pembuka debat. Nyatakan posisimu dengan tegas dan tantang user untuk berargumen.

KEMBALIKAN HANYA JSON:
{"ai_message": "..."}`;

model.generateContent(prompt).then(r => console.log('RESPONSE:', r.response.text(), '\nSTOP REASON:', r.response.candidates[0].finishReason)).catch(console.error);
