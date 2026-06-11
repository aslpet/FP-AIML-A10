# TRD-00 — Overview & Arsitektur · debat.in

| | |
|---|---|
| **Produk** | debat.in |
| **Dokumen** | Technical Requirements Document — Overview (master) |
| **Versi** | 1.0 · Draft |
| **Acuan** | Design Decision — debat.in; PRD v1.0; SRS v1.0 |

> Dokumen ini adalah **master TRD**: arsitektur menyeluruh, keputusan teknis lintas-komponen, konfigurasi, dan deployment. Detail per komponen ada di TRD-01…TRD-08.

---

## 1. Peta Dokumen TRD

| Dok | Komponen | Cakupan | Penanggung jawab (saran) |
|---|---|---|---|
| **TRD-00** | Overview & Arsitektur | Stack, arsitektur, config, deployment, cross-cutting | Lead/PM |
| **TRD-01** | Database & Data Model | Skema PostgreSQL, DDL, indeks, RLS, integritas | — |
| **TRD-02** | Pipeline Berita & Mosi | Cron, ingest RSS, generate+rank, antrian/TTL/fallback | — |
| **TRD-03** | Keamanan Konten | Tiga gerbang, tes martabat, reframe, pengkritik, lapor | — |
| **TRD-04** | Mesin Sesi & Persona | Assignment, persona engine, alur 3 ronde, orkestrasi LLM | — |
| **TRD-05** | Evaluasi & Penilaian | Evaluator terpisah, 4 dimensi, agregasi, gate, ML-ready | — |
| **TRD-06** | Identitas, Streak, History & Share | Auth, streak, history, share, verdict | — |
| **TRD-07** | Kontrak API | Endpoint REST, request/response, error | — |
| **TRD-08** | Layanan IndoBERT (Opsional) | FastAPI serving, dataset, training, integrasi | — |

---

## 2. Stack Teknologi

| Lapisan | Teknologi | Catatan |
|---|---|---|
| Frontend | **Next.js (App Router) + React + TailwindCSS** | SPA-like, responsif |
| Backend | **Next.js API Routes / Route Handlers** | satu proyek dengan FE; tanpa CORS |
| Database | **Supabase PostgreSQL** | lihat TRD-01 |
| Auth | **Supabase Auth** | anonymous + Google OAuth (opsional) |
| LLM | **Google Gemini** | satu API key; model per-peran via config |
| Scheduler | **Cron** (Vercel Cron / penjadwal host) | wajib andal; lihat §6 |
| ML opsional | **Python + FastAPI** (IndoBERT) | microservice privat; lihat TRD-08 |

**Bahasa:** TypeScript di seluruh FE+BE. Python hanya pada microservice IndoBERT (opsional).

---

## 3. Arsitektur Sistem

```
┌──────────────────────── Next.js (satu deployment) ────────────────────────┐
│  FRONTEND (React + Tailwind)                                               │
│   Arena Debat · Dashboard Hasil · History · Share · Onboarding/Consent     │
│        │  (fetch ke /api, same-origin)                                     │
│  BACKEND (Route Handlers)                                                  │
│   ┌─ /api/session/*  → Mesin Sesi & Persona (TRD-04) ─┐                    │
│   │                     └─ Evaluator (TRD-05) ─────────┤                   │
│   ├─ /api/report      → Keamanan: lapor (TRD-03)        │                  │
│   ├─ /api/history,/me → Identitas/Streak/History (TRD-06)│                 │
│   └─ /api/cron/daily  → Pipeline harian (TRD-02) ←─ dipicu Scheduler       │
│                          └─ Gerbang keamanan (TRD-03)                      │
└───────────┬───────────────────────┬───────────────────────┬───────────────┘
            │                       │                        │
     ┌──────▼──────┐        ┌───────▼───────┐        ┌───────▼────────┐
     │  Supabase   │        │    Gemini     │        │  RSS berita     │
     │ PG + Auth   │        │  (1 API key)  │        │  (feed per kat) │
     └─────────────┘        └───────────────┘        └────────────────┘
                                    ▲
                          (opsional) │ HTTP internal/private
                            ┌────────▼─────────┐
                            │ FastAPI/IndoBERT │  (TRD-08)
                            └──────────────────┘
```

**Dua bidang eksekusi yang dipisah tegas:**
- **Bidang harian (batch, flat cost):** scheduler → pipeline → mosi live + antrian. Tidak menyentuh request user. Lihat TRD-02/03.
- **Bidang sesi (per-request, scale dengan user):** user bermain → persona → 3 ronde → evaluasi. Lihat TRD-04/05.

---

## 4. Konfigurasi & Environment

Variabel lingkungan (di-host pada deployment; **tidak** di-bundle ke client):

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=            # untuk client (auth anonim/oauth)
SUPABASE_SERVICE_ROLE_KEY=    # server-only (operasi pipeline/penilaian)

# Gemini
GEMINI_API_KEY=               # SATU key untuk semua panggilan
MODEL_PIPELINE=gemini-flash   # generate+rank+safety
MODEL_PERSONA=gemini-flash    # argumen & tanggapan lawan
MODEL_EVALUATOR=gemini-flash  # evaluasi akhir (naikkan kelas bila perlu)

# Pipeline
RSS_FEEDS_JSON=               # peta kategori → URL feed
DAILY_ACTIVE_CATEGORIES=4     # rotasi 4 dari 5
QUEUE_TTL_DAYS=3
REPORT_RETIRE_THRESHOLD=3
CRON_SECRET=                  # proteksi endpoint /api/cron/*

# IndoBERT (opsional)
INDOBERT_SERVICE_URL=         # kosong = fitur mati, fallback ke LLM
```

**Prinsip:** model dipilih lewat `MODEL_*` (bukan key berbeda). Mengganti kelas model = ubah satu env, tanpa sentuh kode logika.

---

## 5. Pemilihan Model & Disiplin Token (lintas-komponen)

| Peran | Env | Default | Alasan |
|---|---|---|---|
| Pipeline (pilih+generate+rank+safety) | `MODEL_PIPELINE` | Flash | volume kecil, flat, klasifikasi/drafting |
| Persona (pembuka + 3 tanggapan) | `MODEL_PERSONA` | Flash | butuh cepat; karakter via prompt |
| Evaluator (4 dimensi + rationale) | `MODEL_EVALUATOR` | Flash | naikkan kelas hanya jika kualitas kurang |

**Disiplin token (wajib di semua pemanggil LLM):**
1. **Output JSON ketat** — semua panggilan meminta JSON; sertakan pembersih ` ```json ` fence + parser toleran + **fallback default** bila gagal (NFR-13).
2. **Riwayat ringkas untuk persona** — tanggapan ronde mengirim ringkasan giliran sebelumnya, bukan transkrip penuh; **evaluator akhir** menerima teks utuh user (NFR-3).
3. **Retry-with-backoff** untuk rate limit (NFR-14).
4. **Estimasi:** ~8 panggilan pipeline/hari (flat) + ~5 panggilan/sesi. Cost center = sesi.

---

## 6. Scheduler / Cron (titik teknis kritikal)

Pipeline harian **tidak boleh** bergantung pada kunjungan user. Opsi implementasi (pilih sesuai host):
- **Vercel Cron** → memanggil `GET /api/cron/daily` pada jadwal (mis. `0 3 * * *` WIB-adjusted ke UTC).
- **Penjadwal eksternal** (cron OS / GitHub Actions schedule / Supabase scheduled function) → memanggil endpoint yang sama.

**Pengaman endpoint cron:** `/api/cron/*` memverifikasi header `Authorization: Bearer ${CRON_SECRET}` agar tidak bisa dipicu publik. Idempoten per `(tanggal, kategori)` — aman bila terpanggil dua kali.

---

## 7. Concern Lintas-Komponen

- **Waktu/Tanggal:** seluruh "hari" memakai **zona WIB** untuk batas harian (mosi, streak, assignment). Simpan timestamp UTC, konversi di batas logika.
- **Keamanan kredensial:** `SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `CRON_SECRET` **server-only**. Client hanya memegang `ANON_KEY`.
- **Idempotensi:** operasi pipeline & assignment dirancang idempoten (kunci unik DB, lihat TRD-01) agar retry aman.
- **Fallback berlapis:** RSS gagal → antrian → fallback statis (TRD-02); IndoBERT mati → evaluator LLM (TRD-05/08); LLM non-JSON → default skor (TRD-05).
- **Observability minimal:** log terstruktur per tahap pipeline & per sesi (status, model, durasi, error) — cukup untuk debugging FP.

---

## 8. Strategi Deployment

- **Aplikasi utama:** satu deployment Next.js (mis. Vercel) — FE+BE+API+cron menyatu.
- **Database & Auth:** Supabase (managed) — koneksi via env.
- **IndoBERT (opsional):** deployment terpisah (mis. container/host Python). **Tidak diekspos publik** — hanya menerima panggilan dari backend via `INDOBERT_SERVICE_URL` (jaringan privat/secret). Bila env kosong → fitur nonaktif, sistem tetap jalan penuh.

---

## 9. Urutan Implementasi yang Disarankan

1. **TRD-01 Database** (fondasi semua) → skema + Supabase Auth aktif.
2. **TRD-02 + TRD-03 Pipeline + Keamanan** → mosi live bisa dihasilkan.
3. **TRD-04 + TRD-05 Sesi + Evaluasi** → debat bisa dimainkan & dinilai.
4. **TRD-06 Identitas/Streak/History/Share** → loop harian utuh.
5. **TRD-07 API** disusun paralel (kontrak antar FE/BE).
6. **TRD-08 IndoBERT** terakhir, opsional.
