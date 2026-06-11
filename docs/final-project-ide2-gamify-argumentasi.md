# Final Project — AI/ML
## debat.in: Aplikasi Pelatihan Argumentasi Berbasis Gamifikasi dengan Lawan AI dan Topik Harian dari Berita Terkini

---

## 1. Judul

**debat.in: Aplikasi Pelatihan Argumentasi Berbasis Gamifikasi dengan Lawan Debat AI Berpersona dan Sistem Topik Harian dari Berita Terkini**

---

## 2. Latar Belakang

### 2.1 Problem yang Diambil

Kemampuan berargumentasi secara logis, terstruktur, dan responsif terhadap sanggahan adalah keterampilan berpikir kritis yang penting di era informasi — khususnya di Indonesia — namun jarang dilatih secara eksplisit di luar lingkungan akademis formal. Sebagian besar orang tidak memiliki akses ke forum debat, lawan bicara yang kompeten, atau feedback yang terstruktur untuk mengembangkan kemampuan ini.

Permasalahan utama yang diangkat:

- Tidak ada platform yang secara khusus melatih kemampuan argumentasi dalam Bahasa Indonesia secara interaktif dan berbasis AI.
- Latihan argumentasi konvensional membutuhkan lawan bicara manusia — tidak bisa dilakukan kapan saja dan di mana saja.
- Feedback terhadap kualitas argumen umumnya subjektif dan tidak terstruktur.
- Topik debat yang relevan dan kontekstual sulit ditemukan secara konsisten — sering sudah usang atau tidak relevan dengan isu terkini.
- Tidak ada mekanisme gamifikasi yang membuat latihan argumentasi terasa menarik dan memiliki urgensi harian.

### 2.2 Gap Analysis

| Aspek | Platform yang Ada (Kialo, Debate.org, dll) | debat.in (Proyek Ini) |
|---|---|---|
| Bahasa | Inggris | ✅ Bahasa Indonesia |
| Lawan debat | Manusia (async) | ✅ AI real-time berpersona |
| Topik | Statis, dikurasi manual | ✅ Dinamis, dari berita terkini harian |
| Feedback kualitas argumen | Tidak ada / voting subjektif | ✅ Terstruktur, empat dimensi terukur |
| Gamifikasi harian | ❌ Tidak ada sistem harian | ✅ Mekanik harian ala Wordle + streak + verdict |
| Konsistensi antar user | ❌ Setiap user topik berbeda | ✅ User dengan kategori sama → mosi & lawan identik |
| Keamanan konten | Bergantung moderasi komunitas | ✅ Pipeline kurasi otomatis berlapis |
| Aksesibilitas | Butuh akun, komunitas | ✅ Langsung main, anonim, solo |

### 2.3 Aplikasi Serupa

| Aplikasi | Kelebihan | Kelemahan |
|---|---|---|
| **Kialo** | Platform debat terstruktur, visual | Bahasa Inggris, butuh lawan manusia, tidak ada feedback otomatis |
| **Debate.org** | Komunitas debat besar | Async, tidak real-time, tidak ada AI feedback |
| **Replika / Character.AI** | Chatbot conversational | Tidak dirancang untuk debat/argumentasi, tidak ada scoring |
| **Duolingo (analogi sistem)** | Gamifikasi harian yang efektif | Bukan untuk argumentasi |
| **ChatGPT (informal)** | Bisa diajak debat | Tidak ada struktur, scoring, persona konsisten, atau sistem harian |

### 2.4 Novelty

debat.in memiliki tiga keunikan utama:

1. **Sistem topik harian berbasis berita terkini.** Mosi (topik debat) diturunkan otomatis dari berita terhangat setiap hari per kategori, sehingga selalu relevan dan kontekstual. User yang mendapat kategori yang sama di hari yang sama menghadapi **mosi dan lawan yang identik** — menciptakan *shared experience* seperti Wordle.

2. **AI sebagai lawan debat aktif berpersona, bukan chatbot bebas.** AI mengambil posisi yang jelas dan menyerang argumen user secara koheren dalam sesi terstruktur 3 ronde. Persona AI = kombinasi **stance policy** (Kontrarian / Berpendirian) × **gaya retorika** (lima gaya berkarakter), **diundi acak per mosi** (tidak dipilih user). Gaya retorika menetap sepanjang sesi, sementara isi & intensitas serangan **adaptif** terhadap kekuatan argumen user.

3. **Penilaian argumentasi terstruktur empat dimensi.** Di akhir sesi, evaluator yang **terpisah dan netral dari persona** menilai keseluruhan pertukaran lintas empat dimensi (Penalaran, Relevansi, Responsiveness, Kejelasan) dengan skor terukur — bukan umpan balik subjektif — yang dapat **dilacak lintas waktu** sebagai alat refleksi diri.

---

## 3. Penjelasan Singkat Aplikasi

**debat.in** adalah aplikasi web yang melatih kemampuan berargumentasi melalui sesi debat harian melawan AI. Setiap hari, sistem secara otomatis mengambil berita terhangat dari beberapa kategori dan merumuskannya menjadi mosi debat per kategori melalui pipeline kurasi otomatis yang berlapis pengaman keamanan konten.

Saat user membuka aplikasi, mereka **diundi satu kategori secara acak** (terkunci, tidak bisa di-reroll) dan menerima mosi hari itu beserta lawan AI berpersona. Sesi berlangsung dalam **maksimal 3 ronde**: AI membuka dengan menyatakan posisi, lalu di tiap ronde user menulis argumen dan AI menyerang/merespons. **Di akhir sesi (ronde ke-3)**, AI menutup pertukaran sekaligus memberikan **feedback dan penilaian** atas keseluruhan debat.

Setelah menyelesaikan satu sesi, user dapat **lanjut ke kategori lain** yang belum dimainkan hari itu (bonus opsional). Progres dilacak lewat **streak harian** dan **riwayat skor lintas waktu**, dan hasil dapat dibagikan lewat **share card** ala Wordle. Tidak ada leaderboard — skor bersifat personal sebagai alat refleksi diri.

Seluruh interaksi berlangsung dalam Bahasa Indonesia. User dapat langsung bermain secara **anonim** tanpa mendaftar (identitas persisten otomatis); akun Google opsional untuk persistensi lintas-device.

---

## 4. Penerapan AI

### 4.1 Pendekatan Utama — LLM (Gemini)

Inti AI dijalankan oleh satu LLM (Gemini) dengan **peran-peran yang dipisahkan** melalui prompt engineering terstruktur. Pendekatan ini adalah **jalur utama yang sah** untuk proyek (Final Project mensyaratkan adanya penerapan AI; LLM sudah memenuhi).

```
┌──────────────────────── LLM (Google Gemini) ────────────────────────┐
│                                                                      │
│  Peran 1: Pipeline Kurator Mosi (batch harian)                       │
│   → baca berita → filter keamanan → generate ≤3 kandidat mosi        │
│   → skor kelayakan + ranking → pilih mosi live                       │
│                                                                      │
│  Peran 2: Lawan Debat Berpersona (per ronde)                         │
│   → stance (Kontrarian/Berpendirian) × gaya retorika (5)             │
│   → menyerang argumen user; gaya tetap, intensitas adaptif           │
│                                                                      │
│  Peran 3: Evaluator Argumen (sekali, di akhir sesi)                  │
│   → TERPISAH & NETRAL dari persona                                    │
│   → skor 4 dimensi + rationale + feedback naratif                    │
└──────────────────────────────────────────────────────────────────────┘
```

**Pemisahan peran lawan vs evaluator** dijadikan prinsip arsitektur sejak awal: evaluator menilai argumen user terhadap mosi tanpa mengetahui posisi yang dibela AI, sehingga skor tidak bias terhadap persona yang kebetulan didapat user.

**Lima gaya retorika persona:** Sang Penuntut (agresif langsung), Sang Skeptis (Sokratik, menggugat via pertanyaan), Sang Pragmatis (kelayakan dunia nyata), Sang Idealis (dimensi nilai/etika), Sang Analis Data (menggugat struktur penalaran & generalisasi — tanpa memvalidasi kebenaran faktual). Semua persona membawa aturan tetap: **menyerang argumen, bukan pribadi/kelompok.**

### 4.2 Enhancement Opsional — Fine-tuned IndoBERT

Sebagai **pengembangan lanjutan opsional** (bukan kewajiban), model **IndoBERT yang di-fine-tune sendiri** dapat mengambil alih sebagian penilaian angka, menjadikan proyek memiliki komponen model yang dilatih sendiri.

```
┌─────────────── Fine-tuned IndoBERT (opsional) ───────────────┐
│  Task: Argument Quality Scorer                               │
│  Input: [mosi] [SEP] [argumen user]  (Bahasa Indonesia)      │
│  Output: skor Penalaran, Relevansi, Kejelasan (0.0–1.0)      │
│                                                              │
│  Responsiveness TETAP dinilai LLM (butuh konteks multi-ronde)│
│  Feedback naratif TETAP oleh LLM                             │
│  Dataset: LLM distillation + data pemakaian (~500–1000)      │
└──────────────────────────────────────────────────────────────┘
```

**Justifikasi:** skor LLM kurang konsisten lintas waktu (drift, dependensi prompt) dan sulit dievaluasi kuantitatif. Model terlatih lebih deterministik/reproducible dan dapat diukur (MAE/korelasi vs gold set). Skoring jalur utama dirancang **ML-ready** sejak awal (skor per-dimensi + versioning disimpan), sehingga IndoBERT dapat ditambahkan **tanpa membongkar arsitektur**. Jika tidak digarap, sistem tetap berjalan penuh lewat evaluator LLM (fallback otomatis).

### 4.3 Arsitektur Sistem Keseluruhan

```
[RSS BERITA per kategori]  (Politik & Hukum, Ekonomi, Teknologi,
 Sosial & Pendidikan, Lingkungan)
         ↓  (batch harian via cron)
[PIPELINE KURATOR — LLM]
 rotasi 4 dari 5 kategori → ingest berita ≤48 jam
 → GERBANG KEAMANAN (filter berita + tes martabat + reframe + pengkritik)
 → generate ≤3 mosi (kebijakan/fakta/nilai) + skor kelayakan + ranking
 → 1 mosi live/kategori (+ persona) ; sisanya → antrian (TTL 3 hari)
 → fallback statis bila berita & antrian kosong
         ↓
[WEB APP — Next.js]
 user buka app → diundi 1 kategori (terkunci) → terima mosi + persona
         ↓
[SESI DEBAT — maks 3 ronde]
 AI opening (persona) → user arg#1 → AI tanggap#1 (tanpa skor)
 → user arg#2 → AI tanggap#2 (tanpa skor)
 → user arg#3 → AI PENUTUP + EVALUASI (sekali, di akhir)
         ↓
[AKHIR SESI — Dashboard]
 skor total 0–100 + rincian 4 dimensi + feedback + verdict (opsional)
 → share card · streak · history (tren skor lintas waktu)
 → lanjut kategori lain (bonus opsional)
```

### 4.4 Prompt Engineering

Prompt engineering terstruktur adalah kontribusi teknis yang signifikan. Tiap peran memiliki system prompt berbeda:

**Pipeline Kurator Mosi:** menghasilkan hingga 3 mosi debat yang (a) spesifik & bisa diperdebatkan dua sisi, (b) relevan dengan berita, (c) berbentuk klaim kebijakan/fakta/nilai, (d) lolos tes martabat (objek = ide/kebijakan, bukan martabat/keberadaan kelompok; penderitaan korban ditolak); menyertakan skor kelayakan untuk ranking.

**Lawan Debat Berpersona:** mempertahankan **gaya retorika** konsisten sepanjang sesi; menyesuaikan **isi & intensitas** serangan dengan argumen user; menyerang argumen/logika/bukti dan **tidak pernah** pribadi/kelompok; Bahasa Indonesia formal–tegas–menantang.

**Evaluator Argumen (output terstruktur, netral dari persona):**
```json
{
  "penalaran": 1-5, "relevansi": 1-5,
  "responsiveness": 1-5, "kejelasan": 1-5,
  "rationale": { "penalaran": "...", "relevansi": "...",
                 "responsiveness": "...", "kejelasan": "..." },
  "feedback": "teks feedback membangun"
}
```

### 4.5 Skema Penilaian

| Dimensi | Bobot | Menilai |
|---|---|---|
| **Penalaran** | 35% | klaim jelas, alur logis, ditopang alasan/contoh |
| **Relevansi** | 25% | argumen diarahkan ke mosi (berfungsi sebagai gate) |
| **Responsiveness** | 25% | argumen menjawab sanggahan lawan lintas ronde |
| **Kejelasan** | 15% | keterbacaan, struktur, bahasa |

Skala internal **1–5 per dimensi dengan anchor**; ditampilkan ke user sebagai **0–100** (weighted-sum di-rescale). **Gate relevansi:** Relevansi ≤ 2 → skor total di-cap.

---

## 5. Dataset

### 5.1 Jalur Utama (LLM)

| Sumber | Digunakan untuk |
|---|---|
| **RSS berita Indonesia** (per kategori) | Input pembuatan mosi harian |

Tidak ada dataset training pada jalur utama (tidak ada model yang dilatih).

### 5.2 Enhancement Opsional (IndoBERT)

| Sumber | Konten | Digunakan untuk |
|---|---|---|
| **Data pemakaian** (tabel `session`) | argumen riil + skor per-dimensi (ML-ready) | bahan latih (silver) |
| **Synthetic dataset (LLM-generated)** | ~500–1000 argumen berlabel (lemah/sedang/kuat) | fine-tuning scorer |
| **Gold test set (label-tangan)** | ~100–200 sampel | evaluasi (MAE/korelasi) |
| **IndoNLI (opsional)** | NLI Bahasa Indonesia | sinyal pre-training tambahan |

**Proses synthetic dataset:**
```
1. Kumpulkan mosi (dari run sistem / data pemakaian).
2. Prompt LLM meng-generate argumen lemah/sedang/kuat per mosi.
3. Label per-dimensi via LLM berbasis rubrik (anchor 1–5) → silver labels.
4. Label-tangan ~100–200 sampel sebagai gold test set (tidak dilatih).
5. Fine-tune IndoBERT; laporkan MAE & korelasi vs gold set.
```
Pendekatan *LLM-generated synthetic dataset* ini valid secara akademis dan lazim di paper NLP 2023–2025. Konsistensi label dijaga lewat `rubric_version`.

---

## 6. Flow Aplikasi

### 6.1 Target User

Pengguna berbahasa Indonesia yang ingin melatih berpikir kritis dan berargumentasi — mahasiswa, profesional muda, hingga siapa pun yang tertarik isu terkini — secara mandiri, rutin, dan kapan saja, tanpa butuh lawan bicara manusia. Menginginkan friksi rendah (langsung main tanpa wajib mendaftar).

### 6.2 Flow Penggunaan Aplikasi

```
[1] User buka debat.in (web app) → identitas anonim otomatis (uid persisten)
         ↓
[2] Sistem cek: apakah user sudah main hari ini?
    ├── Sudah → tampilkan hasil sesi hari ini (+ opsi lanjut kategori lain)
    └── Belum → lanjut ke step 3
         ↓
[3] Sistem mengundi satu kategori AKTIF secara acak & menguncinya
    Tampilkan: kategori, mosi hari ini, konteks netral singkat
    (persona lawan menempel ke mosi; tidak dipilih user)
         ↓
[4] Sesi debat dimulai — AI menyampaikan argumen pembuka (sesuai persona)
         ↓
[5] Ronde 1: user mengetik argumen → AI menanggapi/menyerang (tanpa skor)
         ↓
[6] Ronde 2: user mengetik argumen → AI menanggapi/menyerang (tanpa skor)
         ↓
[7] Ronde 3: user mengetik argumen → AI PENUTUP + EVALUASI keseluruhan
         ↓
[8] Akhir sesi — Dashboard:
    - Skor total 0–100 + rincian 4 dimensi + rationale
    - Feedback keseluruhan membangun
    - Verdict (opsional): "Argumen Bertahan / Imbang Ketat / Argumen Runtuh"
    - Share card · streak diperbarui
         ↓
[9] Opsi: lanjut ke kategori aktif lain yang belum dimainkan (bonus)
    atau "Kembali besok untuk mosi baru!"
         ↓
[10] History: tren skor per dimensi lintas waktu (refleksi diri)
```

### 6.3 Keamanan Konten (ringkas)

Karena mosi berasal dari berita nyata secara otomatis, pipeline menerapkan pengaman berlapis: **(1)** filter berita (buang perkara hukum bernama & non-debatable); **(2)** tes martabat + reframe (objek harus ide/kebijakan, bukan martabat/keberadaan kelompok; penderitaan korban ditolak) + LLM-pengkritik (tolak framing menghakimi di premis); **(3)** tombol lapor (mosi → auto-retire; respons AI → tinjau tim). Prinsip: **debat boleh menyerang ide & kebijakan, tidak boleh menjadikan keberadaan/martabat kelompok sebagai mosi.**

### 6.4 Stack Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | **Next.js + React + TailwindCSS** |
| Backend | **Next.js** (API Routes / Route Handlers — satu proyek dengan FE) |
| Database & Auth | **Supabase** (PostgreSQL + anonymous auth + Google OAuth opsional) |
| News Fetching | **RSS** berita Indonesia (per kategori) |
| LLM API | **Google Gemini** (free tier; satu API key, model per-peran via config) |
| Scheduler | **Cron** harian (generate & kunci mosi; tidak dipicu kunjungan user) |
| Fine-tuned Model (opsional) | **IndoBERT** via HuggingFace, di-serve sebagai microservice **Python + FastAPI** (tidak diekspos publik) |

### 6.5 Dokumentasi Teknis Terkait

Rancangan rinci tersedia pada dokumen turunan: **Design Decision — debat.in** (kanon keputusan), **PRD**, **SRS**, dan **TRD** yang dipecah per komponen (Overview, Database, Pipeline, Keamanan, Sesi & Persona, Evaluasi, Identitas/Streak/History/Share, Kontrak API, IndoBERT opsional).