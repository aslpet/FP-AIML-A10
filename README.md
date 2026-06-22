<div align="center">

# debat.in ™

### Pelatihan Argumentasi Berbasis Gamifikasi dengan Lawan Debat AI Berpersona & Mosi Harian dari Berita

Web app untuk **melatih kemampuan berargumentasi** dalam Bahasa Indonesia — beradu argumen **3 ronde** melawan AI berpersona, dengan **mosi harian** yang dikurasi otomatis dari berita terkini, lalu dinilai pada **4 dimensi** di akhir sesi. Bernuansa *daily puzzle* ala Wordle dengan estetika ruang sidang **Ace Attorney**.

</div>

---

## Daftar Isi

- [Latar Belakang](#latar-belakang)
- [Fitur Utama](#fitur-utama)
- [Tech Stack](#tech-stack)
- [Arsitektur](#arsitektur)
- [Struktur Folder](#struktur-folder)
- [Setup Lokal](#setup-lokal)
- [Environment Variables](#environment-variables)
- [Database (Supabase)](#database-supabase)
- [Pipeline & Cron Harian](#pipeline--cron-harian)
- [Scripts](#scripts)
- [Testing](#testing)
- [Atribusi](#atribusi)

---

## Latar Belakang

Kemampuan berargumentasi secara logis, terstruktur, dan responsif terhadap sanggahan adalah keterampilan berpikir kritis yang penting, namun **jarang dilatih secara eksplisit** di luar lingkungan akademis formal. Sebagian besar orang tidak punya akses ke forum debat, lawan bicara yang kompeten, atau feedback terstruktur untuk mengasah kemampuan ini.

Masalah yang diangkat:
- Belum ada platform yang khusus melatih argumentasi **Bahasa Indonesia** secara interaktif berbasis AI.
- Latihan konvensional butuh lawan manusia — tidak bisa kapan saja.
- Feedback kualitas argumen umumnya **subjektif & tidak terstruktur**.
- Topik debat yang relevan & kontekstual sulit ditemukan secara konsisten.
- Tidak ada gamifikasi yang membuat latihan terasa menarik dan punya **urgensi harian**.

### Gap Analysis

| Aspek | Platform yang ada (Kialo, Debate.org, dll) | **debat.in** |
|---|---|---|
| Bahasa | Inggris | ✅ Bahasa Indonesia |
| Lawan debat | Manusia (async) | ✅ AI real-time berpersona |
| Topik | Statis, kurasi manual | ✅ Dinamis, dari berita harian |
| Feedback | Tidak ada / voting subjektif | ✅ Terstruktur, 4 dimensi terukur |
| Gamifikasi harian | ❌ | ✅ Mekanik harian ala Wordle + streak |
| Konsistensi antar-user | ❌ topik beda tiap user | ✅ kategori sama → mosi & lawan identik |
| Aksesibilitas | Butuh akun/komunitas | ✅ Langsung main, anonim |

### Novelty

1. **Mosi harian dari berita terkini.** Mosi diturunkan otomatis dari berita terhangat per kategori. User dengan kategori sama di hari yang sama mendapat **mosi & lawan identik** → *shared experience* ala Wordle.
2. **AI sebagai lawan debat aktif berpersona**, bukan chatbot bebas. AI mengambil posisi jelas dan menyerang argumen secara koheren dalam sesi 3 ronde. Persona = **stance** (Kontrarian/Berpendirian) × **gaya retorika** (5 gaya), diundi acak per mosi.
3. **Penilaian 4 dimensi yang netral dari persona.** Evaluator terpisah menilai keseluruhan pertukaran (Penalaran, Relevansi, Responsiveness, Kejelasan) dengan skor terukur — dilacak lintas waktu sebagai alat refleksi diri.

> Proyek ini adalah **Final Project AI/ML**. Target pengguna: penutur Bahasa Indonesia yang ingin melatih berpikir kritis secara mandiri, rutin, kapan saja. Dokumen rancangan terkait ada di [`docs/`](docs/).

---

## Fitur Utama

- 🎲 **Mosi harian terkunci** — kategori diundi & tidak bisa di-reroll (anti-reroll), sama untuk semua pemain.
- ⚔️ **Debat 3 ronde** melawan AI berpersona; intensitas serangan adaptif terhadap kekuatan argumen.
- 🧑‍⚖️ **Penilaian 4 dimensi** (0–100 + tile per dimensi) + verdict 3 tingkat + catatan juri.
- 🔥 **Streak harian**, 🗂️ **history** skor lintas waktu, dan 📣 **share card**.
- 🕶️ **Anonim langsung main** (auth anonim Supabase) — tanpa wajib mendaftar.
- 🎭 **Persona showcase** — halaman info 5 gaya retorika lawan AI.
- 🎨 Estetika **Ace Attorney courtroom** (folder berkas, speech bubble, font pixel).

---

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Framework | **Next.js 14** (App Router) + **React 18** + **TypeScript** |
| Styling | **TailwindCSS** + **Framer Motion** |
| Backend | Next.js **Route Handlers** (`src/app/api/**`) |
| Database & Auth | **Supabase** (PostgreSQL + anonymous auth) |
| LLM | **Google Gemini** (`@google/generative-ai`) — 1 model, 3 peran via prompt |
| Berita | **rss-parser** (RSS berita Indonesia per kategori) |
| Testing | **Vitest** |
| Deploy | **Vercel** (+ Vercel Cron Job harian) |

---

## Arsitektur

Satu LLM (Gemini) menjalankan **tiga peran terpisah** lewat prompt engineering, ditambah agregasi skor deterministik.

```
[RSS berita per kategori]
        │  (batch harian via cron)
        ▼
[PIPELINE KURATOR — LLM]  rotasi 4 dari 5 kategori → ingest berita
  → gerbang keamanan (filter + tes martabat + reframe) → generate ≤3 mosi
  → skor kelayakan + ranking → 1 mosi "live"/kategori (+ persona diundi)
  → sisanya ke antrian (TTL 3 hari) → fallback statis bila kosong
        │  tersimpan di tabel daily_motion
        ▼
[WEB APP — Next.js]  user buka app → diundi 1 kategori (terkunci) → mosi + persona
        ▼
[SESI DEBAT — maks 3 ronde]
  AI opening → user arg#1 → AI tanggap#1 → … → user arg#3 → AI penutup + evaluasi
        ▼
[HASIL]  skor 0–100 + 4 dimensi + feedback + verdict → share · streak · history
```

**Tiga peran AI:**
- **Kurator mosi** — [`src/lib/pipeline/generate.ts`](src/lib/pipeline/generate.ts)
- **Lawan berpersona** — [`src/lib/llm/prompts/persona.ts`](src/lib/llm/prompts/persona.ts) (5 gaya × 2 stance)
- **Evaluator** (netral dari persona) — [`src/lib/llm/prompts/evaluator.ts`](src/lib/llm/prompts/evaluator.ts)

**Penilaian** ([`src/lib/session/scoring.ts`](src/lib/session/scoring.ts)): skala 1–5 per dimensi (bobot Penalaran 35% · Relevansi 25% · Responsiveness 25% · Kejelasan 15%), di-rescale ke 0–100 lewat **kurva kemurahan** (`GENEROSITY`, makin kecil makin murah hati). **Gate relevansi:** Relevansi ≤ 2 → total di-cap ×0.5.

> Detail prompt ada di [`docs/fixing/PROMPTS.md`](docs/fixing/PROMPTS.md).

---

## Struktur Folder

```
src/
├─ app/
│  ├─ page.tsx                 # Landing (hero + carousel mosi)
│  ├─ arena/[sessionId]/       # Layar debat
│  ├─ result/[sessionId]/      # Hasil & penilaian
│  ├─ history/ persona/ about/ # Sub-halaman
│  └─ api/                     # Route handlers (session, history, cron, me, report)
├─ components/ui/              # Navbar, Toast (komponen aktif)
├─ lib/
│  ├─ pipeline/                # Pipeline harian (rss, generate, promote, queue, fallback)
│  ├─ session/                 # engine, assignment, scoring (+ tests)
│  ├─ llm/                     # gemini client + prompts (persona, evaluator)
│  ├─ supabase/                # client, server, admin
│  └─ config.ts, date.ts       # konfigurasi env & util tanggal (WIB)
├─ instrumentation.ts          # cron in-app (HANYA dev/self-host; nonaktif di Vercel)
public/assets/                 # aset visual Ace Attorney
supabase/                      # migrations + seed SQL
docs/                          # PRD/SRS/TRD & catatan desain
```

---

## Setup Lokal

**Prasyarat:** Node.js **18.17+** (disarankan 20+), akun **Supabase**, dan **Google Gemini API key**.

```bash
# 1. Install dependency
npm install

# 2. Siapkan environment
cp .env.example .env.local
#   lalu isi nilai-nilainya (lihat bagian Environment Variables)

# 3. Siapkan database (lihat bagian Database)

# 4. Jalankan dev server
npm run dev
# buka http://localhost:3000
```

Saat dev (di luar Vercel), [`instrumentation.ts`](src/instrumentation.ts) otomatis menjalankan pipeline saat startup bila mosi hari ini belum ada — jadi landing langsung punya mosi untuk dicoba.

---

## Environment Variables

Salin dari [`.env.example`](.env.example). `NEXT_PUBLIC_*` **terekspos ke browser**; sisanya **rahasia** (server-only).

| Variable | Wajib | Keterangan |
|---|:---:|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL project Supabase (publik) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon key Supabase (publik) |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role — **rahasia**, bypass RLS (server) |
| `GEMINI_API_KEY` | ✅ | API key Gemini |
| `GEMINI_API_KEY_PIPELINE` / `_PERSONA` / `_EVALUATOR` | — | Key per-peran (opsional; fallback ke `GEMINI_API_KEY`) |
| `MODEL_PIPELINE` / `_PERSONA` / `_EVALUATOR` | — | ID model per-peran (default `gemini-2.0-flash`) — **pastikan valid** |
| `RSS_FEEDS_JSON` | ✅ | JSON `{kategori: [url,...]}` sumber RSS |
| `DAILY_ACTIVE_CATEGORIES` | — | Jumlah kategori aktif/hari (default `4`) |
| `QUEUE_TTL_DAYS` | — | TTL antrian mosi (default `3`) |
| `REPORT_RETIRE_THRESHOLD` | — | Ambang laporan untuk auto-retire (default `3`) |
| `CRON_SECRET` | ✅ | Token autentikasi endpoint cron |
| `INDOBERT_SERVICE_URL` | — | URL microservice IndoBERT (opsional, enhancement) |

---

## Database (Supabase)

1. Buat project Supabase baru.
2. Buka **SQL Editor** dan jalankan skema awal: [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. **Aktifkan Anonymous sign-in** di **Authentication → Providers → Anonymous** (wajib — app login anonim otomatis).
4. (Opsional) jalankan [`supabase/seed-manual-m1.sql`](supabase/seed-manual-m1.sql) untuk data contoh.

Relasi inti: `session.motion_id` & `report.motion_id` → `daily_motion(motion_id)`.

---

## Pipeline & Cron Harian

Pipeline harian ([`src/lib/pipeline/index.ts`](src/lib/pipeline/index.ts)) men-generate & mengunci mosi per kategori. **Idempoten** per `(kategori, tanggal-WIB)` — aman dipanggil 2×.

**Trigger manual:**
```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/daily
```

**Reset mosi hari ini** (mis. untuk uji ulang). Pipeline akan skip kategori yang sudah `live`, jadi "lucuti" dulu di SQL Editor:
```sql
-- Retire mosi live hari ini (WIB) → boleh diregenerasi
update daily_motion set status = 'retired'
where status = 'live' and live_date = (now() at time zone 'Asia/Jakarta')::date;
-- (opsional) retire antrian lama agar dipaksa jalur RSS fresh
update daily_motion set status = 'retired' where status = 'queued';
```
…lalu trigger cron lagi. Untuk **hapus total** (riwayat ikut terhapus karena FK):
```sql
truncate daily_motion, session, report restart identity cascade;
```

> **Scheduling.** Di production (Vercel), penjadwalan memakai **Vercel Cron** ([`vercel.json`](vercel.json) → `/api/cron/daily`, `0 18 * * *` = 01:00 WIB). Cron in-app di [`instrumentation.ts`](src/instrumentation.ts) sengaja **dimatikan di Vercel** (`process.env.VERCEL`) dan hanya untuk dev/self-host.

---

## Scripts

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Dev server (hot reload) |
| `npm run build` | Build production |
| `npm start` | Jalankan hasil build |
| `npm run lint` | ESLint (next lint) |
| `npm test` | Jalankan unit test (Vitest, sekali jalan) |
| `npm run test:watch` | Vitest mode watch |

---

## Testing

Unit test (Vitest) mencakup logika murni di `src/lib` — agregasi skor & verdict, rotasi kategori, antrian, dan streak:
- [`src/lib/session/scoring.test.ts`](src/lib/session/scoring.test.ts)
- [`src/lib/pipeline/rotation.test.ts`](src/lib/pipeline/rotation.test.ts), [`queue.test.ts`](src/lib/pipeline/queue.test.ts)
- [`src/lib/user/streak.test.ts`](src/lib/user/streak.test.ts)

```bash
npm test
```

---

## Atribusi

**Final Project AI/ML** — debat.in. Aset visual bergaya *courtroom / Ace Attorney* berada di [`public/assets`](public/assets). Seluruh interaksi dalam Bahasa Indonesia.
