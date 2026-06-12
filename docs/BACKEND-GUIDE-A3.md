# Backend Guide — debat.in (A3)

Dokumen panduan untuk anggota **A3 (Backend)**. Mencakup semua yang sudah dikerjakan, apa yang harus dilakukan manual, dan cara testing end-to-end.

---

## 1. Yang Sudah Dikerjakan

### Struktur Proyek

```
debat-in/                              # root (Next.js App Router + TS + Tailwind)
├── package.json                       # deps: next, supabase, gemini, rss-parser, framer-motion, recharts
├── tsconfig.json                      # strict + path alias @/*
├── next.config.mjs
├── tailwind.config.ts                 # warna ink/paper/brand
├── postcss.config.mjs
├── vitest.config.ts                   # unit test config
├── vercel.json                        # cron: /api/cron/daily setiap jam 3 pagi
├── .env.example                       # template env vars
├── .gitignore
├── supabase/
│   ├── migrations/
│   │   └── 0001_init.sql              # 6 enum + 5 tabel + unique index + RLS
│   └── seed-manual-m1.sql             # 5 mosi live + persona untuk testing M1
└── src/
    ├── app/
    │   ├── layout.tsx                 # root layout, lang="id"
    │   ├── globals.css                # tailwind + .tile + prefers-reduced-motion
    │   ├── page.tsx                   # placeholder landing
    │   └── api/
    │       └── cron/daily/route.ts    # GET endpoint — proteksi CRON_SECRET → runDailyPipeline()
    ├── lib/
    │   ├── config.ts                  # env terpusat (getter, lazy)
    │   ├── date.ts                    # todayWIB(), yesterdayWIB(), daysAgoWIB()
    │   ├── supabase/
    │   │   ├── client.ts              # browser client (NEXT_PUBLIC_*)
    │   │   ├── server.ts              # server client (cookie-based)
    │   │   └── admin.ts               # service role client (lazy, bypass RLS)
    │   ├── pipeline/
    │   │   ├── types.ts               # CategoryId, RssArticle, CandidateMotion, dll
    │   │   ├── index.ts               # runDailyPipeline() — orkestrator utama
    │   │   ├── rotation.ts            # rotasi 4/5 kategori + pagar absen-2-hari
    │   │   ├── rss.ts                 # RSS ingest ≤48 jam, error isolation per-feed
    │   │   ├── generate.ts            # prompt LLM: Gerbang 1+2 + generate + rank + safety
    │   │   ├── promote.ts             # promote() tunggal + undi persona + tie-break
    │   │   ├── queue.ts               # antrian LIFO TTL 3 hari + housekeeping
    │   │   ├── fallback.ts            # 10 mosi timeless (2/kategori)
    │   │   ├── rotation.test.ts       # 5 unit tests
    │   │   └── queue.test.ts          # 7 unit tests
    │   ├── session/
    │   │   ├── scoring.ts             # aggregate() + computeVerdict() — pure functions
    │   │   └── scoring.test.ts        # 12 unit tests
    │   └── user/
    │       ├── streak.ts              # updateStreak() — pure function
    │       └── streak.test.ts         # 8 unit tests
    └── components/                    # (kosong — diisi A1/A2)
```

### Ringkasan per Milestone

| Milestone | Apa | File kunci |
|---|---|---|
| **M0** | Project scaffold + DB migration | `package.json`, `tsconfig.json`, `supabase/migrations/0001_init.sql` |
| **M1** | Seed mosi + Supabase clients + struktur pipeline | `supabase/seed-manual-m1.sql`, `src/lib/supabase/*`, `src/lib/pipeline/*` |
| **M2** | Pipeline orkestrator + cron endpoint | `src/lib/pipeline/index.ts`, `src/app/api/cron/daily/route.ts` |
| **M5** | Unit tests 32/32 | `vitest.config.ts`, `*.test.ts` |

### Database (5 tabel)

| Tabel | Fungsi | Unique constraint |
|---|---|---|
| `daily_motion` | Mosi + lifecycle (candidate→queued→live→retired) | `uq_live_per_category_per_day`, `uq_live_per_source_per_day` |
| `app_user` | Identitas + streak | PK=`uid` |
| `assignment` | Undian kategori harian (anti-reroll) | PK=`(uid, play_date)` |
| `session` | Sesi debat + penilaian 4 dimensi | `uq_session (uid, play_date, category)` |
| `report` | Laporan konten | `uq_report_unique (motion_id, uid)` |

RLS aktif di `session`, `app_user`, `assignment`, `report` — policy `uid = auth.uid()`.

### Pipeline Harian — Alur

```
GET /api/cron/daily  (Authorization: Bearer <CRON_SECRET>)
  │
  ├─ 1. rotateCategories()         → pilih 4 dari 5 kategori (pagar absen ≥2 hari)
  │
  └─ 2. For each active category:
       │
       ├─ IDEMPOTENSI: cek daily_motion live (category, today) → jika ada → SKIP
       │
       ├─ JALUR 1 (fresh): ingest RSS → pilih artikel → generateCandidates()
       │     └─ 1 panggilan LLM: Gerbang 1 + generate ≤3 mosi + Gerbang 2 + skor
       │     └─ promote() kandidat terbaik → live
       │     └─ sisanya yang lolos → queued
       │
       ├─ JALUR 2 (antrian): jika fresh gagal → takeFromQueue()
       │     └─ LIFO + TTL 3 hari → promote()
       │
       └─ JALUR 3 (fallback): jika antrian kosong → insertFallbackMotion() → promote()
       │
       └─ Error isolation: 1 kategori gagal ≠ gagalkan semua

  3. housekeepQueue()              → retire yang >3 hari
```

---

## 2. Yang Harus Dilakukan (Manual)

### 2.1 Setup Supabase

1. **Buat project Supabase** di [supabase.com](https://supabase.com)
2. **Copy kredensial** dari dashboard → isi `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. **Aktifkan anonymous sign-in** (Implementation Plan temuan #7):
   - Dashboard → Authentication → Settings → **Enable anonymous sign-ins** = ON
4. **Jalankan migration** di Supabase SQL Editor:
   - Copy-paste seluruh isi `supabase/migrations/0001_init.sql`
   - Execute

### 2.2 Setup Gemini API Key

1. Dapatkan API key dari [Google AI Studio](https://aistudio.google.com/apikey)
2. Tambahkan ke `.env.local`:
   ```bash
   GEMINI_API_KEY=AIza...
   MODEL_PIPELINE=gemini-2.0-flash
   MODEL_PERSONA=gemini-2.0-flash
   MODEL_EVALUATOR=gemini-2.0-flash
   ```

### 2.3 Setup RSS Feed URLs

Tambahkan ke `.env.local` (format JSON, minimal 1 URL per kategori):
```bash
RSS_FEEDS_JSON={"politik_hukum":["https://rss.tempo.co/nasional"],"ekonomi":["https://rss.tempo.co/bisnis"],"teknologi":["https://rss.tempo.co/tekno"],"sosial_pendidikan":["https://rss.tempo.co/pendidikan"],"lingkungan":[]}
```

### 2.4 Setup Cron Secret

```bash
CRON_SECRET=buat-string-random-panjang
DAILY_ACTIVE_CATEGORIES=4
QUEUE_TTL_DAYS=3
REPORT_RETIRE_THRESHOLD=3
```

### 2.5 `.env.local` lengkap

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Gemini
GEMINI_API_KEY=AIza...
MODEL_PIPELINE=gemini-2.0-flash
MODEL_PERSONA=gemini-2.0-flash
MODEL_EVALUATOR=gemini-2.0-flash

# Pipeline
RSS_FEEDS_JSON={...}
DAILY_ACTIVE_CATEGORIES=4
QUEUE_TTL_DAYS=3
REPORT_RETIRE_THRESHOLD=3
CRON_SECRET=random-string-123456

# IndoBERT (opsional, kosongkan dulu)
INDOBERT_SERVICE_URL=
```

---

## 3. Cara Testing

### 3.1 Unit Tests

```bash
npm test              # run semua (32 tests, <1 detik)
npm run test:watch    # watch mode
```

**Yang di-test:**

| Area | File | Jumlah test |
|---|---|---|
| Agregasi skor + gate relevansi | `src/lib/session/scoring.test.ts` | 12 |
| Verdict 3 tingkat | (satu file dengan di atas) | 12 |
| Streak (konsekutif/bolong/bonus) | `src/lib/user/streak.test.ts` | 8 |
| Rotasi 4-dari-5 + pagar | `src/lib/pipeline/rotation.test.ts` | 5 |
| Queue TTL + LIFO | `src/lib/pipeline/queue.test.ts` | 7 |

### 3.2 Build Check

```bash
npm run build
```

Pastikan tidak ada error. Route `/api/cron/daily` harus muncul sebagai `ƒ (Dynamic)`.

### 3.3 Test Pipeline (setelah Supabase & Gemini siap)

**3.3a. Test dengan seed manual M1 dulu (tanpa Gemini):**

Jalankan `supabase/seed-manual-m1.sql` di Supabase SQL Editor. Ini insert 5 mosi `status='live'` langsung — A4 bisa langsung testing mesin sesi.

Verifikasi:
```sql
SELECT category, motion_text, persona_stance, persona_style, status, live_date
FROM daily_motion WHERE status = 'live';
```

Harus return 5 baris, tiap kategori punya mosi live + persona.

**3.3b. Test pipeline fresh (dengan RSS + Gemini):**

```bash
# 1. Hapus semua mosi live/queued dulu (reset)
#    Di Supabase SQL Editor:
#    DELETE FROM daily_motion WHERE status IN ('live', 'queued', 'candidate');

# 2. Jalankan pipeline
curl -H "Authorization: Bearer random-string-123456" \
  http://localhost:3000/api/cron/daily
```

Response yang diharapkan (200):
```json
{
  "ran": true,
  "summary": {
    "politik_hukum": "fresh",
    "ekonomi": "fresh",
    "teknologi": "fallback",
    "sosial_pendidikan": "fresh"
  }
}
```

**3.3c. Test idempotensi (panggil 2×):**

```bash
# Panggil lagi — harus skip (idempoten)
curl -H "Authorization: Bearer random-string-123456" \
  http://localhost:3000/api/cron/daily
```

Response tetap `"ran": true` tapi summary tetap sama. Cek DB: tetap 1 mosi live per kategori.

**3.3d. Test proteksi CRON_SECRET:**

```bash
# Tanpa header — harus 401
curl http://localhost:3000/api/cron/daily

# Secret salah — harus 401
curl -H "Authorization: Bearer wrong" \
  http://localhost:3000/api/cron/daily
```

**3.3e. Test fallback (simulasi RSS mati):**

```bash
# Kosongkan RSS_FEEDS_JSON di .env.local:
RSS_FEEDS_JSON={"politik_hukum":[],"ekonomi":[],"teknologi":[],"sosial_pendidikan":[],"lingkungan":[]}

# Restart dev server, lalu panggil cron
# Semua kategori harus fallback ke antrian/statis
curl -H "Authorization: Bearer random-string-123456" \
  http://localhost:3000/api/cron/daily

# Cek DB: source_outlet harus 'static_fallback'
```

**3.3f. Verifikasi DB setelah pipeline:**

```sql
-- Semua kategori aktif hari ini harus punya 1 live
SELECT category, motion_text, persona_stance, persona_style,
       source_outlet, status, live_date
FROM daily_motion
WHERE live_date = CURRENT_DATE AND status = 'live'
ORDER BY category;

-- Cek antrian (queued)
SELECT category, count(*) FROM daily_motion
WHERE status = 'queued' GROUP BY category;
```

### 3.4 Checklist Verifikasi E2E (dari Implementation Plan §6)

| # | Test | Expect |
|---|---|---|
| 1 | `curl cron 2×` | Panggilan ke-2 skip, tetap 1 live/kategori |
| 2 | Cabut RSS | Antrian terpakai |
| 3 | Kosongkan antrian | `source_outlet='static_fallback'` |
| 4 | Argumen uji: kasus hukum bernama | Ditolak / di-reframe (Gerbang 1+2) |
| 5 | Argumen uji: tragedi fokus-korban | Ditolak (Gerbang 2 tragedi) |
| 6 | Laporkan mosi 3 uid berbeda | Auto-retire (Gerbang 3) |

---

## 4. Troubleshooting

| Masalah | Solusi |
|---|---|
| `Missing SUPABASE_SERVICE_ROLE_KEY` | Isi `.env.local`, restart dev server |
| `Missing GEMINI_API_KEY` | Isi `.env.local`, restart dev server |
| Anonymous sign-in gagal | Cek Supabase dashboard → Auth → Settings → Enable anonymous |
| RSS feed timeout | Timeout per-feed sudah di-handle, cek log `[rss] Failed to parse` |
| LLM response tidak JSON | Parser toleran + fallback kosong, cek log `[generate] Failed to parse` |
| CRON_SECRET mismatch | Pastikan `.env.local` dan `curl -H` pakai string yang sama |
| Migration gagal | Pastikan tidak ada tabel/enum dengan nama sama; drop dulu jika perlu |

---

## 5. Yang Belum / Menunggu A4

Komponen berikut butuh A4 untuk jalan end-to-end:

| Komponen | File | Pemilik |
|---|---|---|
| Gemini wrapper + JSON parser + retry-backoff | `src/lib/llm/gemini.ts` | A4 |
| System prompt persona (5 gaya × 2 stance) | `src/lib/llm/prompts/persona.ts` | A4 |
| System prompt evaluator (4 dimensi + anchor) | `src/lib/llm/prompts/evaluator.ts` | A4 |
| Mesin sesi: assignment, engine, alur 3 ronde | `src/lib/session/` | A4 |
| Endpoint `/api/session/*` | `src/app/api/session/` | A4 |
| Endpoint `/api/history`, `/api/me`, `/api/report` | `src/app/api/` | A4 |
| Streak server-side + next-category | `src/lib/user/` | A4 |
| Deployment Vercel + production cron | — | A4 |

Pipeline backend (A3) sudah **independent** — bisa dites sendiri tanpa menunggu A4.
