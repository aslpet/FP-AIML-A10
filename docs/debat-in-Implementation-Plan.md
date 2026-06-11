# Implementation Plan — debat.in

| | |
|---|---|
| **Produk** | debat.in — Pelatihan Argumentasi Berbasis Gamifikasi dengan Topik Harian dari Berita |
| **Dokumen** | Implementation Plan (rencana eksekusi & pembagian kerja tim) |
| **Versi** | 1.0 |
| **Acuan** | Design Decision; PRD v1.0; SRS v1.0; TRD-00…TRD-08 |
| **Tim** | 4 anggota — A1 (UI/UX & FE), A2 (FE), A3 (BE), A4 (Fullstack) |

---

## 1. Konteks

Tim 4 orang akan membangun **debat.in** dari nol: web app pelatihan argumentasi Bahasa Indonesia bergaya Wordle — user beradu argumen 3 ronde melawan AI berpersona, dengan mosi harian yang digenerate otomatis dari berita RSS, dievaluasi 4 dimensi di akhir sesi. Repo saat ini **greenfield** (hanya `docs/`, belum ada kode).

Dokumen desain sudah matang dan berlapis: Design Decision (kanon) → PRD → SRS → TRD-00…08. Plan ini menurunkannya menjadi urutan eksekusi + pembagian kerja:

| Anggota | Peran |
|---|---|
| **A1** | UI/UX & FE — desain visual + komponen |
| **A2** | FE keseluruhan — arsitektur FE, state, integrasi API |
| **A3** | BE — database + pipeline harian + keamanan konten |
| **A4** | Fullstack — mesin sesi + evaluator + API + deployment + integrasi |

**Keputusan scope (sudah dikunci tim):**
- Fase 1 **LLM-full** = target pasti. Milestone-based, tanpa tanggal.
- **Verdict** dan **Google OAuth (link akun)** masuk scope.
- **IndoBERT** = stretch goal saja (M6), bukan target; skema data tetap ML-ready.
- Dimensi penilaian = **4** (default dokumen, tidak diubah).
- Tabel `assignment` **tetap terpisah** dari `session` (rekomendasi TRD-01 §5 — lebih bersih menegakkan "1 undian/hari").

---

## 2. Hasil Analisis & Evaluasi Dokumen

### 2.1 Kekuatan (dipakai apa adanya)
- Arsitektur 1 deployment Next.js (FE+BE) + Supabase + Gemini — minim moving parts, tanpa CORS.
- Pemisahan **bidang harian (batch/cron, flat cost)** vs **bidang sesi (per-request)** — jadi dasar pembagian kerja A3 vs A4.
- Skema DB ML-ready + idempotensi via unique index — sudah executable.
- Keamanan konten 3 gerbang dengan reframe-first — aturannya lengkap, tinggal diturunkan jadi prompt.
- TRD-07 sudah berupa kontrak API lengkap — memungkinkan FE & BE jalan **paralel dengan mock**.

### 2.2 Temuan yang harus dikoreksi/dilengkapi saat implementasi

| # | Temuan | Tindakan |
|---|---|---|
| 1 | Dokumen `final-project-ide2` (ArgueDaily) **usang** — konflik dengan debat.in (feedback per-ronde vs hanya di akhir; user pilih mode vs persona diundi) | Acuan implementasi = PRD/SRS/Design Decision/TRD; dokumen ide hanya latar |
| 2 | **Bug DDL TRD-01 §2.5**: `CHECK (score_penalaran BETWEEN 1 AND 5);` ditulis mengambang di luar `CREATE TABLE` | Saat migration, tulis sebagai CHECK constraint per kolom di dalam tabel (4 dimensi) |
| 3 | **Persona di jalur antrian**: TRD-02 §6 promote dari queue tidak eksplisit mengundi persona | Buat fungsi `promote()` tunggal yang selalu mengundi persona + `ai_position`, dipakai jalur fresh/queue/fallback |
| 4 | **Gap — rate limiting**: `/api/session/respond` memicu panggilan Gemini per request; kuota free tier bisa habis | Validasi panjang argumen (mis. 20–2000 karakter, angka final saat dev) + guard `current_round` di server |
| 5 | **Gap — kepemilikan `/api/session/result`**: backend pakai service role, RLS tidak menolong | Wajib verifikasi `session.uid == auth.uid` di server |
| 6 | **Konten fallback statis belum ada** | Siapkan ≥2 mosi timeless per kategori (10 mosi) — tugas konten, masuk M2 |
| 7 | **Supabase anonymous sign-in** off by default | Aktifkan manual di dashboard project (M0) |
| 8 | **Tanggal WIB** tersebar di banyak komponen (assignment, streak, pipeline, play_date) | Utility tunggal `todayWIB()`; larang `new Date()` lokal tersebar |
| 9 | **Strategi testing tidak ada di dokumen** | Unit test logika murni (agregasi skor + gate, streak, rotasi, TTL, verdict) + skrip uji E2E manual (§6) |
| 10 | **Spek UI/UX tidak ada** (dokumen hanya teks) | A1 produksi wireframe + design system di M0, sebelum komponen dibangun |

---

## 3. Arsitektur & Struktur Proyek

Satu proyek Next.js (App Router, TypeScript, TailwindCSS) + Supabase + Gemini (1 API key, model per-peran via env `MODEL_PIPELINE/PERSONA/EVALUATOR`).

```
src/
  app/
    page.tsx                     # landing → arena (assignment + mosi hari ini)
    arena/[sessionId]/page.tsx   # debat 3 ronde
    result/[sessionId]/page.tsx  # dashboard hasil + verdict + share
    history/page.tsx             # riwayat + grafik tren 4 dimensi
    api/
      session/{today,start,respond,next-category,result}/route.ts
      history/route.ts · me/route.ts · me/consent/route.ts
      report/route.ts
      cron/daily/route.ts        # Bearer CRON_SECRET, idempoten
  lib/
    config.ts                    # env terpusat + nama model per peran
    date.ts                      # todayWIB() — satu-satunya sumber "hari"
    supabase/{client,server,admin}.ts   # anon client / token resolve / service role
    llm/gemini.ts                # wrapper: JSON ketat + pembersih fence + retry-backoff
    llm/prompts/{pipeline,persona,evaluator}.ts
    pipeline/{rotation,rss,generate,promote,housekeeping}.ts
    session/{assignment,engine,evaluator,verdict}.ts
    user/streak.ts
  components/{arena,result,history,share,ui}/
supabase/migrations/0001_init.sql   # DDL TRD-01 (enum, 5 tabel, indeks, RLS)
```

---

## 4. Pembagian Kerja (workstream per anggota)

| | A1 — UI/UX & FE | A2 — FE | A3 — BE | A4 — Fullstack |
|---|---|---|---|---|
| **Fokus** | Wireframe, design system, semua komponen visual | Arsitektur FE, state sesi, integrasi API, auth client | DB + **bidang harian**: pipeline cron, RSS, generate+rank+safety, antrian/TTL/fallback | **Bidang sesi**: mesin sesi, persona, evaluator, API user, streak, deployment |
| **Artefak kunci** | Wireframe 4 layar; `components/**`; share card | `app/**/page.tsx`; API client + mock; auth flow; error/loading states | `supabase/migrations`; `lib/pipeline/**`; prompt pipeline; `api/cron/daily` | `lib/session/**`; `lib/llm/gemini.ts`; prompt persona+evaluator; `api/session/*`; deploy |
| **Stretch (M6)** | — | — | dataset sintetis + labeling | FastAPI serving IndoBERT |

**Pembagian prompt engineering:** A3 memegang prompt pipeline (generate+rank+safety, Gerbang 1–2); A4 memegang prompt persona (5 gaya × 2 stance) + evaluator (anchor 1–5, anti-bias klaster tengah).

---

## 5. Milestone

### M0 — Fondasi & Kontrak (semua anggota, paralel)
Tujuan: semua orang bisa kerja paralel tanpa saling menunggu.

| Anggota | Tugas |
|---|---|
| A4 | Scaffold Next.js (App Router + TS + Tailwind) + struktur folder §3; `lib/config.ts`, `lib/date.ts`; setup project Supabase + Vercel; `.env.example` sesuai TRD-00 §4 |
| A3 | Migration `0001_init.sql` — enum, 5 tabel, unique index, RLS, **dengan koreksi CHECK constraint** (temuan #2); aktifkan anonymous sign-in di Supabase (temuan #7) |
| A2 | API client typed dari kontrak TRD-07 + **mock route handlers** (fixture JSON) supaya FE jalan tanpa BE; `supabase.auth.signInAnonymously()` di first-load |
| A1 | Wireframe 4 layar inti (landing/onboarding+consent, arena, hasil, history) + design system Tailwind (warna, tipografi, tone "tanding") |

**Definisi selesai:** `npm run dev` jalan; FE menampilkan arena dari mock; DB termigrasi; auth anonim menghasilkan uid persisten.

### M1 — Vertical Slice: debat bisa dimainkan end-to-end (fokus A4 + A2)
Tujuan: membuktikan loop inti dengan Gemini riil sebelum pipeline ada — **mosi di-seed manual** ke DB. Risiko teknis terbesar proyek (orkestrasi LLM) dibuktikan paling awal.

| Anggota | Tugas |
|---|---|
| A4 | `lib/llm/gemini.ts` (JSON ketat + retry-backoff — NFR-13/14); persona engine + system prompt 5 gaya (TRD-04 §3); alur sesi: opening → R1–R2 tanpa skor → R3 penutup + evaluator terpisah (TRD-04 §4); evaluator + agregasi + gate relevansi + verdict (TRD-05 §3–5); endpoint `today/start/respond/result` riil; assignment server-side terkunci (TRD-04 §1); guard kepemilikan & ronde (temuan #4, #5) |
| A2 | Ganti mock → API riil; state machine sesi di FE (new/in_progress/finished); indikator "AI menyusun argumen…"; penanganan error retry (NFR-17) |
| A1 | Komponen arena (bubble transkrip, input argumen, progres ronde) + dashboard hasil (skor lingkaran 0–100, 4 kartu dimensi + rationale, verdict headline) |
| A3 | Seed script mosi manual untuk M1; mulai M2 lebih awal (paralel) |

**Definisi selesai:** satu user anonim bisa main 3 ronde penuh melawan persona, dapat skor 4 dimensi + feedback + verdict, tersimpan di `session`.

### M2 — Pipeline Harian + Keamanan Konten (fokus A3)

| Anggota | Tugas |
|---|---|
| A3 | Rotasi 4-dari-5 dengan pagar absen-2-hari (TRD-02 §3); ingest RSS ≤48 jam per kategori (`rss-parser`, error per-feed terisolasi); prompt tunggal generate+rank+Gerbang 1+2 (tes martabat, reframe-first, tragedi-fokus, pengkritik digabung — TRD-02 §5, TRD-03); `promote()` tunggal (undi persona + `ai_position` sadar-beban — temuan #3); antrian LIFO TTL 3 hari + housekeeping; **10 mosi fallback statis** (temuan #6); idempotensi per (tanggal, kategori); log per tahap |
| A4 | Endpoint `api/cron/daily` + proteksi `CRON_SECRET` + Vercel Cron config (`vercel.json`) |

**Definisi selesai:** panggil cron 2× → tiap kategori aktif punya tepat 1 mosi live berpersona, panggilan ke-2 skip (idempoten); cabut RSS → jatuh ke antrian; kosongkan antrian → jatuh ke fallback statis.

### M3 — Loop Gamifikasi Lengkap (A4 BE; A1+A2 FE)

| Anggota | Tugas |
|---|---|
| A4 | Streak server-side (TRD-06 §2, hanya sesi pertama/hari); `next-category` (bonus, berurutan, tanpa ulang); endpoint `history` + `me` + `consent`; endpoint `report` + auto-retire ≥3 laporan unik + fallback kategori hari itu (TRD-03 §6) |
| A2 | Flow next-category; consent modal main pertama; integrasi history + report |
| A1 | History view + grafik tren 4 dimensi (Recharts); share card (clipboard, format TRD-06 §5); tombol lapor pada mosi & tiap respons AI; tampilan streak |

**Definisi selesai:** loop utuh "datang → bertanding → resolusi → pamer → besok lagi" jalan; laporan ke-3 me-retire mosi.

### M4 — Google OAuth + Polish (A2 lead)

| Anggota | Tugas |
|---|---|
| A2 | `supabase.auth.linkIdentity({provider:'google'})` — uid tetap, progres terbawa (TRD-06 §1.2); setup Google provider di Supabase + GCP OAuth credential |
| A4 | Set `app_user.is_anonymous=false` saat link |
| A1 | Polish responsif mobile; empty/loading/error states semua layar; onboarding copy |

**Definisi selesai:** anonim → link Google → logout/login di device lain → streak & history utuh.

### M5 — Hardening & Demo Readiness (semua)
- Unit test logika murni (temuan #9): agregasi+gate, streak, rotasi, TTL, verdict — Vitest.
- Uji prompt evaluator: argumen lemah/sedang/kuat × beberapa mosi → cek distribusi skor tidak menumpuk di 3–4 (TRD-05 §4); tuning anchor bila perlu.
- Validasi input + batas panjang argumen final (temuan #4); cek tidak ada kredensial bocor ke client bundle (NFR-9).
- Deploy produksi Vercel + cron aktif beberapa hari berturut sebelum demo (bukti pipeline harian riil); dry-run demo.

**Definisi selesai:** checklist verifikasi (§6) hijau semua di production.

### M6 — Stretch: IndoBERT (hanya jika M0–M5 selesai)
Sesuai TRD-08:

| Anggota | Tugas |
|---|---|
| A3 | Dataset — silver dari `session` + sintetis ~500–1000 + gold label-tangan 100–200 |
| A4 | Fine-tune IndoBERT (regresi 3 dimensi) + FastAPI `/score` privat + integrasi evaluator dengan fallback otomatis ke LLM; lapor MAE/korelasi vs gold |

Tidak menyentuh komponen lain — `INDOBERT_SERVICE_URL` kosong = fitur mati.

### Urutan dependensi & pemotongan scope

```
M0 → M1 → {M2, M3 boleh overlap} → M4 → M5 → (M6)
```

Jika waktu menipis, potong berurutan: **M6** dulu, lalu **M4 (OAuth)**, lalu **grafik tren** (history tetap berupa daftar). **Verdict dipertahankan** (effort ~nol).

---

## 6. Verifikasi (E2E)

1. **Pipeline:** `curl -H "Authorization: Bearer $CRON_SECRET" /api/cron/daily` 2× → cek DB: tepat 1 `live` per kategori aktif, persona terisi, panggilan ke-2 skip (idempoten). Matikan feed → antrian terpakai; kosongkan antrian → `source_outlet='static_fallback'`.
2. **Sesi:** browser incognito → uid anonim otomatis → refresh berkali-kali → kategori tidak berubah (anti-reroll) → main 3 ronde → skor+rationale+verdict tersimpan; ulang kategori sama → ditolak (`uq_session`).
3. **Keamanan:** suntik artikel uji (kasus hukum bernama, tragedi fokus-korban, mosi kelayakan kelompok) → tertolak/ter-reframe sesuai TRD-03; laporkan mosi dari 3 uid berbeda → auto-retire.
4. **Streak:** selesaikan sesi 2 hari berturut (atau mock `todayWIB`) → streak 2; bolong 1 hari → reset 1; sesi bonus tidak menambah.
5. **Skor:** 3 sesi dengan kualitas argumen sengaja dibedakan (asal-asalan / sedang / serius) → skor terurut masuk akal; argumen off-topic → gate relevansi memangkas total.
6. **OAuth:** link Google → login device lain → history & streak terbawa.
7. **Unit test:** `npm test` hijau (agregasi, gate, streak, rotasi, TTL, verdict).
