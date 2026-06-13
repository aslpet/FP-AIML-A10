# Backend Guide — debat.in

Dokumen panduan backend lengkap. Mencakup semua yang sudah dikerjakan, setup manual, cara testing, dan struktur proyek.

---

## 1. Yang Sudah Dikerjakan

### Struktur Proyek Lengkap

```
debat-in/                                    # root (Next.js 14 App Router + TS + Tailwind)
├── package.json                             # deps: next, supabase, gemini, rss-parser, framer-motion, recharts, vitest
├── tsconfig.json                            # strict + path alias @/*, exclude protoFE
├── next.config.mjs
├── tailwind.config.ts                       # warna ink/paper/brand, shadow, keyframe
├── postcss.config.mjs
├── vitest.config.ts                         # unit test (globals, node, @ alias)
├── vercel.json                              # Vercel Cron: /api/cron/daily pukul 3 pagi
├── .env.example                             # 17 env var (template)
├── .gitignore                               # node_modules, .next, .env*, out/
├── supabase/
│   ├── migrations/0001_init.sql             # 6 enum + 5 tabel + 6 unique index + RLS
│   └── seed-manual-m1.sql                   # 5 mosi live + persona (testing M1)
└── src/
    ├── app/
    │   ├── layout.tsx                       # root layout, lang="id", metadata
    │   ├── globals.css                      # tailwind + .tile + prefers-reduced-motion
    │   ├── page.tsx                         # placeholder landing
    │   └── api/
    │       ├── cron/daily/route.ts          # GET — Bearer CRON_SECRET → runDailyPipeline()
    │       ├── history/route.ts             # GET — riwayat + tren 4 dimensi
    │       ├── me/
    │       │   ├── route.ts                 # GET — profil user + streak
    │       │   ├── consent/route.ts         # POST — persetujuan data
    │       │   └── link-google/route.ts     # POST — set is_anonymous=false setelah OAuth
    │       ├── report/route.ts              # POST — lapor mosi/respons + auto-retire
    │       └── session/
    │           ├── today/route.ts           # GET — assignment + state (new/in_progress/finished/unavailable)
    │           ├── start/route.ts           # POST — mulai sesi + AI pembuka
    │           ├── respond/route.ts         # POST — kirim argumen + tanggapan/r3 + evaluasi
    │           ├── result/route.ts          # GET — hasil sesi spesifik
    │           └── next-category/route.ts   # POST — kategori bonus (204 jika habis)
    ├── lib/
    │   ├── config.ts                        # env terpusat — 3 API key Gemini + model per peran + pipeline
    │   ├── date.ts                          # todayWIB(), yesterdayWIB(), daysAgoWIB()
    │   ├── supabase/
    │   │   ├── client.ts                    # browser client (NEXT_PUBLIC_* via config)
    │   │   ├── server.ts                    # server client (cookie-based, via config)
    │   │   └── admin.ts                     # service role client (lazy, bypass RLS)
    │   ├── llm/
    │   │   ├── gemini.ts                    # shared Gemini wrapper — JSON parse + retry-backoff
    │   │   └── prompts/
    │   │       ├── persona.ts               # persona prompt builder (5 gaya × 2 stance)
    │   │       └── evaluator.ts             # evaluator prompt builder (4 dimensi + anchor)
    │   ├── pipeline/
    │   │   ├── types.ts                     # CategoryId, RssArticle, CandidateMotion, dll
    │   │   ├── index.ts                     # runDailyPipeline() — orkestrator utama + tie-break
    │   │   ├── rotation.ts                  # rotasi 4/5 + pagar absen-2-hari (fair random)
    │   │   ├── rss.ts                       # RSS ingest ≤48 jam + error isolation per-feed
    │   │   ├── generate.ts                  # prompt LLM: Gate 1+2 + generate + rank + safety + retry
    │   │   ├── promote.ts                   # promote() tunggal + undi persona + tie-break claim_form
    │   │   ├── queue.ts                     # antrian LIFO + TTL 3 hari WIB + housekeeping
    │   │   ├── fallback.ts                  # 10 mosi timeless (2/kategori)
    │   │   ├── rotation.test.ts             # 5 unit tests
    │   │   └── queue.test.ts                # 7 unit tests
    │   ├── session/
    │   │   ├── assignment.ts                # getOrAssignCategory() + getNextCategory() — anti-reroll
    │   │   ├── engine.ts                    # startSession() + respondToSession() — 3 ronde + evaluasi
    │   │   ├── scoring.ts                   # aggregate() + computeVerdict() — pure functions
    │   │   └── scoring.test.ts              # 12 unit tests
    │   └── user/
    │       ├── streak.ts                    # updateStreak() — konsekutif/bolong/bonus
    │       └── streak.test.ts               # 8 unit tests
    └── components/                          # (kosong — diisi A1/A2)
```

### Daftar Endpoint API

| Method | Path | Auth | Fungsi | TRD |
|---|---|---|---|---|
| GET | `/api/cron/daily` | Bearer CRON_SECRET | Jalankan pipeline harian | TRD-02 |
| GET | `/api/session/today` | user token | Assignment + state session | TRD-04 |
| POST | `/api/session/start` | user token | Mulai sesi + AI opening | TRD-04 |
| POST | `/api/session/respond` | user token | Kirim argumen + AI tanggapan/evaluasi | TRD-04/05 |
| GET | `/api/session/result` | user token | Lihat hasil sesi | TRD-05/06 |
| POST | `/api/session/next-category` | user token | Kategori bonus (belum dimainkan) | TRD-04 |
| GET | `/api/history` | user token | Riwayat + tren 4 dimensi | TRD-06 |
| GET | `/api/me` | user token | Profil user + streak | TRD-06 |
| POST | `/api/me/consent` | user token | Setujui pemakaian data | TRD-06 |
| POST | `/api/me/link-google` | user token | Set is_anonymous=false pasca OAuth | M4 |
| POST | `/api/report` | user token | Lapor mosi/respons + auto-retire | TRD-03/06 |

### Alur Sesi Debat (TRD-04 §4)

```
GET /api/session/today      → assignment kategori (anti-reroll) + state
POST /api/session/start      → AI opening (ronde 0, persona)
POST /api/session/respond    → user arg#1 → AI tanggapan#1 (ronde 1, tanpa skor)
POST /api/session/respond    → user arg#2 → AI tanggapan#2 (ronde 2, tanpa skor)
POST /api/session/respond    → user arg#3 → AI penutup + EVALUATOR (ronde 3, SEKALI)
                              → simpan 4 skor + rationale + feedback + verdict + streak
GET /api/session/result      → dashboard hasil
POST /api/session/next-category → lanjut kategori bonus (opsional)
```

### Pipeline Harian (TRD-02)

```
Cron trigger (jam 3 pagi UTC / Vercel Cron / curl manual)
  │
  ├─ Rotasi: 4 dari 5 kategori (pagar absen ≥2 hari, fair random)
  │
  ├─ PER KATEGORI:
  │   ├─ Idempotensi: skip jika sudah ada mosi live hari ini
  │   ├─ RSS ingest: HTTP fetch ≤48 jam (bukan LLM)
  │   ├─ 1 artikel teratas dipilih
  │   ├─ 1 PANGGILAN LLM: Gate 1 + generate ≤3 kandidat + skor + Gate 2
  │   ├─ Kandidat lolos → promote (undi persona + tie-break claim_form)
  │   ├─ Kandidat terbaik → status='live'
  │   ├─ Sisanya → status='queued' (antrian LIFO TTL 3 hari)
  │   └─ Jika fresh gagal → antrian → fallback statis
  │
  └─ Housekeeping: retire mosi antrian >3 hari
```

### Evaluasi (TRD-05)

```
4 dimensi (skala internal 1–5, tampilan 0–100):
  Penalaran     35%   klaim jelas, alur logis, alasan/contoh
  Relevansi     25%   fokus ke mosi (GATE: ≤2 → ×0.5)
  Responsiveness 25%   menjawab sanggahan lintas ronde
  Kejelasan     15%   keterbacaan, struktur, bahasa

Verdict 3 tingkat (nol LLM, dari skor yang ada):
  base = 0.5×responsiveness + 0.5×penalaran
  ≥4.0 → "Argumen Bertahan" | ≥2.5 → "Imbang Ketat" | <2.5 → "Argumen Runtuh"
```

### Database (5 tabel + RLS)

| Tabel | Peran | Unique constraint | RLS |
|---|---|---|---|
| `daily_motion` | Mosi + lifecycle | `uq_live_per_category_per_day`, `uq_live_per_source_per_day` | ❌ (baca publik) |
| `app_user` | Identitas + streak | PK=`uid` | ✅ `uid = auth.uid()` |
| `assignment` | Undian kategori | PK=`(uid, play_date)` | ✅ `uid = auth.uid()` |
| `session` | Sesi + penilaian | `uq_session (uid, play_date, category)` | ✅ `uid = auth.uid()` |
| `report` | Laporan konten | `uq_report_unique (motion_id, uid)` | ✅ `uid = auth.uid()` |

---

## 2. Setup Manual

### 2.1 Supabase

1. Buat project di [supabase.com](https://supabase.com)
2. Copy kredensial ke `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. Aktifkan anonymous sign-in:
   - Dashboard → Authentication → Sign In / Up → **Allow anonymous sign-ins** = ON
4. Jalankan migration:
   - SQL Editor → copy-paste `supabase/migrations/0001_init.sql` → Execute

### 2.2 Gemini API Key

1. [Google AI Studio](https://aistudio.google.com/apikey) → Create API Key
2. `.env.local`:
   ```bash
   GEMINI_API_KEY=AIza...                       # fallback (wajib)
   GEMINI_API_KEY_PIPELINE=AIza...              # opsional — khusus pipeline
   GEMINI_API_KEY_PERSONA=AIza...               # opsional — khusus persona
   GEMINI_API_KEY_EVALUATOR=AIza...             # opsional — khusus evaluator
   MODEL_PIPELINE=gemini-2.5-flash
   MODEL_PERSONA=gemini-2.5-flash
   MODEL_EVALUATOR=gemini-2.5-flash
   ```

### 2.3 RSS Feed URLs

```bash
RSS_FEEDS_JSON={"politik_hukum":["https://rss.tempo.co/nasional","https://www.cnnindonesia.com/nasional/rss"],"ekonomi":["https://rss.tempo.co/bisnis","https://www.cnnindonesia.com/ekonomi/rss"],"teknologi":["https://rss.tempo.co/tekno"],"sosial_pendidikan":["https://rss.tempo.co/gaya","https://www.republika.co.id/rss/pendidikan"],"lingkungan":["https://www.mongabay.co.id/feed"]}
```

### 2.4 Konfigurasi Wajib

```bash
CRON_SECRET=debat-in-2026-pipeline-secret-xyz
DAILY_ACTIVE_CATEGORIES=4
QUEUE_TTL_DAYS=3
REPORT_RETIRE_THRESHOLD=3
INDOBERT_SERVICE_URL=                           # kosongkan (opsional)
```

### 2.5 `.env.local` Lengkap

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Gemini
GEMINI_API_KEY=AIza...
GEMINI_API_KEY_PIPELINE=
GEMINI_API_KEY_PERSONA=
GEMINI_API_KEY_EVALUATOR=
MODEL_PIPELINE=gemini-2.5-flash
MODEL_PERSONA=gemini-2.5-flash
MODEL_EVALUATOR=gemini-2.5-flash

# Pipeline
RSS_FEEDS_JSON={"politik_hukum":["https://rss.tempo.co/nasional","https://www.cnnindonesia.com/nasional/rss"],"ekonomi":["https://rss.tempo.co/bisnis","https://www.cnnindonesia.com/ekonomi/rss"],"teknologi":["https://rss.tempo.co/tekno"],"sosial_pendidikan":["https://rss.tempo.co/gaya","https://www.republika.co.id/rss/pendidikan"],"lingkungan":["https://www.mongabay.co.id/feed"]}
DAILY_ACTIVE_CATEGORIES=4
QUEUE_TTL_DAYS=3
REPORT_RETIRE_THRESHOLD=3
CRON_SECRET=debat-in-2026-pipeline-secret-xyz

# IndoBERT (opsional)
INDOBERT_SERVICE_URL=
```

---

## 3. Testing

### 3.1 Unit Tests

```bash
npm test              # 32 tests, <1 detik
npm run test:watch    # watch mode
```

| Area | File | Jumlah |
|---|---|---|
| Agregasi skor + gate relevansi + verdict | `src/lib/session/scoring.test.ts` | 12 |
| Streak (konsekutif/bolong/bonus/cross-bulan) | `src/lib/user/streak.test.ts` | 8 |
| Rotasi 4/5 + pagar absen-2-hari | `src/lib/pipeline/rotation.test.ts` | 5 |
| Queue TTL + LIFO + housekeeping | `src/lib/pipeline/queue.test.ts` | 7 |

### 3.2 Build

```bash
npm run build
```

Harus muncul 12 route `ƒ (Dynamic)` tanpa error.

### 3.3 Test Pipeline (Cron)

```sql
-- Reset DB sebelum test
DELETE FROM daily_motion;
```

```powershell
# 1. Proteksi
curl.exe http://localhost:3000/api/cron/daily
# Expect: 401 Unauthorized

# 2. Pipeline penuh
curl.exe -H "Authorization: Bearer debat-in-2026-pipeline-secret-xyz" http://localhost:3000/api/cron/daily
# Expect: {"ran":true,"summary":{"ekonomi":"fresh",...},"duration_ms":...}

# 3. Idempotensi — panggil 2×
curl.exe -H "Authorization: Bearer debat-in-2026-pipeline-secret-xyz" http://localhost:3000/api/cron/daily
# Expect: semua kategori skip dengan "already live — skipping (idempotent)"
```

### 3.4 Test Sesi Debat (perlu Supabase Auth)

```powershell
# 1. Dapatkan token anonim via Supabase SDK atau curl Supabase Auth API
#    (ini perlu FE atau Postman untuk simulasikan)

# 2. GET /api/session/today
#    Expect: state="new" + category + motion

# 3. POST /api/session/start
#    Body: {"category":"ekonomi"}
#    Expect: session_id + ai_message (opening)

# 4. POST /api/session/respond
#    Body: {"session_id":"...","user_message":"Argumen minimal 20 karakter..."}
#    Expect ronde 1-2: ai_message + current_round + finished=false
#    Expect ronde 3: ai_message + finished=true + result{scores, verdict}

# 5. GET /api/session/result?session_id=...
#    Expect: scores + total_score + verdict
```

### 3.5 Test dari Browser (FE sederhana)

Buka `http://localhost:3000` di browser. Console browser:

```javascript
// 1. Auth anonim
const { data } = await supabase.auth.signInAnonymously();
const token = data.session.access_token;

// 2. Cek today
const res1 = await fetch("/api/session/today", {
  headers: { Authorization: `Bearer ${token}` }
});
console.log(await res1.json());

// 3. Mulai sesi
const res2 = await fetch("/api/session/start", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({ category: "ekonomi" })
});
console.log(await res2.json());
```

### 3.6 Verifikasi DB

```sql
-- Mosi live hari ini
SELECT category, motion_text, persona_stance, persona_style, source_outlet
FROM daily_motion WHERE status = 'live' AND live_date = CURRENT_DATE;

-- Antrian
SELECT category, count(*) FROM daily_motion WHERE status = 'queued' GROUP BY category;

-- Sesi user
SELECT play_date, category, finished, total_score, verdict
FROM session WHERE uid = '<uid>' ORDER BY play_date DESC;
```

---

## 4. Troubleshooting

| Masalah | Solusi |
|---|---|
| `Missing SUPABASE_SERVICE_ROLE_KEY` | Isi `.env.local`, restart dev |
| `Missing GEMINI_API_KEY` | Isi `.env.local`, restart dev |
| Gemini 429 (rate limit) | Ganti model ke `gemini-2.5-flash`; tunggu quota reset; atau bikin key baru |
| Anonymous sign-in gagal | Supabase → Auth → Sign In / Up → Allow anonymous = ON |
| RSS 0 artikel | Cek URL feed valid; Antara feed sering stale; pakai Tempo/CNN |
| LLM JSON parse gagal | Parser toleran + fallback; cek log `[generate] Raw response` |
| Pipeline `FAILED: duplicate key` | `DELETE FROM daily_motion` — ada sisa dari run sebelumnya |
| `state: "unavailable"` di /today | Tidak ada kategori tersisa hari ini — pipeline belum dijalankan |
| CRON_SECRET mismatch | Pastikan `.env.local` dan header curl pakai string yang sama |
| Migration gagal | Drop existing enum/tabel dulu jika conflict |

---

## 5. Batasan Diketahui

| Batasan | Dampak | Mitigasi |
|---|---|---|
| IndoBERT tidak diintegrasi | Skor tetap LLM (valid per Design Decision) | Fallback otomatis, `INDOBERT_SERVICE_URL=` kosong |
| Tidak ada tabel `review_needed` di session | Evaluator gagal tidak ditandai untuk tinjau | Minor — bisa ditambahkan kolom jika perlu |
| OpenAI/DeepSeek tidak didukung | Hanya Gemini | Bisa ditambah adapter LLM di masa depan |
| State `"unavailable"` tidak ada di TRD-07 | FE harus handle 3 state + unavailable | Bisa diganti ke error 503 jika strict |
| FE belum dibangun | Tidak bisa test end-to-end via browser penuh | Gunakan curl / Supabase SDK untuk tes API |
