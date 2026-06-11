# Final Project — AI/ML
## ArgueDaily: Gamified Argument Training Web App dengan Sistem Topik Harian

---

## 1. Judul

**ArgueDaily: Aplikasi Pelatihan Argumentasi Berbasis Gamifikasi dengan LLM dan Sistem Topik Harian dari Berita Terkini**

---

## 2. Latar Belakang

### 2.1 Problem yang Diambil

Kemampuan berargumentasi secara logis, terstruktur, dan berbasis bukti adalah keterampilan kritis yang penting di era informasi yang mudah diakses di zaman sekarang, khususnya di Indonesia — namun jarang dilatih secara eksplisit di luar lingkungan akademis formal. Sebagian besar orang tidak memiliki akses ke forum debat, lawan bicara yang kompeten, atau feedback yang terstruktur untuk mengembangkan kemampuan ini.

Permasalahan utama yang diangkat:

- Tidak ada platform yang secara khusus melatih kemampuan argumentasi dalam Bahasa Indonesia secara interaktif dan berbasis AI
- Latihan argumentasi konvensional membutuhkan lawan bicara manusia — tidak bisa dilakukan kapan saja dan di mana saja
- Feedback terhadap kualitas argumen umumnya subjektif dan tidak terstruktur
- Topik debat yang relevan dan kontekstual sulit ditemukan secara konsisten — sering sudah usang atau tidak relevan dengan isu terkini
- Tidak ada mekanisme gamifikasi yang membuat latihan argumentasi terasa engaging dan memiliki urgensi harian

### 2.2 Gap Analysis

| Aspek | Platform yang Ada (Kialo, Debate.org, dll) | ArgueDaily (Proyek Ini) |
|---|---|---|
| Bahasa | Inggris | ✅ Bahasa Indonesia |
| Lawan debat | Manusia (async) | ✅ AI real-time |
| Topik | Statis, dikurasi manual | ✅ Dinamis, dari berita terkini harian |
| Feedback kualitas argumen | Tidak ada / voting subjektif | ✅ Terstruktur, per ronde |
| Gamifikasi harian | ❌ Tidak ada sistem harian | ✅ Satu topik per hari, berganti tiap hari |
| Konsistensi antar user | ❌ Setiap user topik berbeda | ✅ User dengan kategori sama → topik identik |
| Aksesibilitas | Butuh akun, komunitas | ✅ Langsung main, solo |

### 2.3 Aplikasi Serupa

| Aplikasi | Kelebihan | Kelemahan |
|---|---|---|
| **Kialo** | Platform debat terstruktur, visual | Bahasa Inggris, butuh lawan manusia, tidak ada feedback otomatis |
| **Debate.org** | Komunitas debat besar | Async, tidak real-time, tidak ada AI feedback |
| **Replika / Character.AI** | Chatbot conversational | Tidak dirancang untuk debat/argumentasi, tidak ada scoring |
| **Duolingo (analogi sistem)** | Gamifikasi harian yang efektif | Bukan untuk argumentasi |
| **ChatGPT (informal)** | Bisa diajak debat | Tidak ada struktur, tidak ada scoring, tidak ada sistem harian |

### 2.4 Novelty

ArgueDaily memiliki tiga keunikan utama:

1. **Sistem topik harian berbasis berita terkini** — topik debat diambil secara otomatis dari berita terhangat setiap hari per kategori, sehingga selalu relevan dan kontekstual. User yang mendapat kategori yang sama di hari yang sama akan mendapat topik yang identik — menciptakan shared experience seperti sistem Wordle.

2. **Structured debate dengan AI sebagai lawan argumen aktif** — bukan sekadar chatbot, AI mengambil posisi yang jelas (devil's advocate atau fixed position) dan berdebat secara koheren dalam sesi terstruktur 3 ronde, bukan percakapan bebas.

3. **Feedback argumentasi berlapis per ronde** — setiap ronde user mendapat feedback terstruktur yang mencakup relevansi argumen terhadap topik, kualitas logika, dan score kuantitatif — bukan hanya feedback akhir yang umum.

---

## 3. Penjelasan Singkat Aplikasi

ArgueDaily adalah web application yang melatih kemampuan berargumentasi melalui sesi debat harian melawan AI. Setiap hari, sistem secara otomatis mengambil berita terhangat dari berbagai kategori dan menghasilkan satu topik debat per kategori. Saat user membuka aplikasi, mereka langsung mendapat satu topik yang di-assign secara random — tanpa bisa memilih atau mengganti.

User kemudian memilih mode debat: apakah AI akan selalu mengambil posisi berlawanan (Devil's Advocate) atau mempertahankan posisi tetap terhadap topik (Fixed Position). Sesi debat berlangsung dalam 3 ronde terstruktur — setiap ronde AI menyampaikan argumen, user merespons, lalu sistem memberikan feedback dan score untuk ronde tersebut. Di akhir sesi, user mendapat summary feedback keseluruhan dan total score.

Seluruh interaksi berlangsung dalam Bahasa Indonesia, membuat aplikasi ini relevan dan aksesibel untuk pengguna Indonesia.

---

## 4. Penerapan AI

### 4.1 Dua Opsi Pendekatan AI

Terdapat dua opsi implementasi yang bisa dipilih berdasarkan kebutuhan dan constraint proyek:

---

#### Opsi A — Full LLM API

Seluruh fungsi AI dijalankan oleh satu LLM via API (Gemini / Groq), dengan peran berbeda yang dipisahkan melalui prompt engineering.

```
┌─────────────────────────────────────────┐
│           LLM API (Gemini / Groq)        │
│                                          │
│  Role 1: Topic Generator                 │
│  → Baca artikel berita                   │
│  → Generate topik debat yang spesifik    │
│                                          │
│  Role 2: Debate Opponent                 │
│  → Ambil posisi (devil's advocate /      │
│     fixed position)                      │
│  → Berdebat secara koheren per ronde     │
│                                          │
│  Role 3: Argument Evaluator              │
│  → Evaluasi argumen user per ronde       │
│  → Output: feedback naratif + score      │
└─────────────────────────────────────────┘
```

**Kelebihan Opsi A:**
- Implementasi lebih cepat dan fokus ke sistem
- Tidak perlu dataset atau training
- Kualitas output debat dan feedback sangat baik
- Cocok jika constraint waktu ketat

**Kekurangan Opsi A:**
- Tidak ada komponen model yang dilatih sendiri
- Bergantung penuh pada pihak ketiga
- Scoring konsistensinya bergantung dari prompt — tidak ada model terpisah yang bisa dievaluasi secara kuantitatif

---

#### Opsi B — Hybrid: LLM API + Fine-tuned IndoBERT

LLM API menangani debat dan feedback naratif, sementara model IndoBERT yang di-fine-tune secara khusus menangani scoring kualitas argumen secara terpisah.

```
┌──────────────────────────────────────────────────┐
│               LLM API (Gemini / Groq)             │
│  ├── Topic Generator: generate topik dari berita  │
│  ├── Debate Opponent: berdebat per ronde          │
│  └── Feedback Generator: feedback naratif         │
└──────────────────────────────────────────────────┘
                        +
┌──────────────────────────────────────────────────┐
│         Fine-tuned IndoBERT (dilatih sendiri)     │
│                                                   │
│  Task: Argument Quality Scorer                    │
│  Input: Teks argumen user (Bahasa Indonesia)      │
│  Output:                                          │
│    ├── Relevansi score (0.0 – 1.0)               │
│    ├── Koherensi logika score (0.0 – 1.0)        │
│    └── Kekuatan bukti/evidence score (0.0 – 1.0) │
│                                                   │
│  Dataset: Synthetic — di-generate oleh LLM       │
│  (~500–1000 contoh argumen berlabel)              │
└──────────────────────────────────────────────────┘
```

**Kelebihan Opsi B:**
- Ada komponen model yang benar-benar dilatih sendiri → lebih kuat sebagai AI/ML project
- Scoring lebih konsisten dan dapat dievaluasi secara kuantitatif (accuracy, F1)
- IndoBERT menjawab konteks Bahasa Indonesia secara proper
- Dua komponen AI dengan peran jelas dan tidak overlap

**Kekurangan Opsi B:**
- Perlu membuat synthetic dataset (~500–1000 sampel) via LLM
- Perlu fine-tuning pipeline (lebih banyak effort)
- Lebih kompleks secara arsitektur

**Catatan tentang synthetic dataset:**
Dataset untuk fine-tuning IndoBERT dibuat menggunakan LLM — LLM di-prompt untuk menghasilkan contoh argumen Bahasa Indonesia dengan label kualitasnya (lemah / sedang / kuat). Pendekatan ini disebut *LLM-generated synthetic dataset* dan secara akademis valid, banyak digunakan di paper NLP 2023–2024.

---

### 4.2 Arsitektur Sistem Keseluruhan

```
[NEWS API]
Fetch berita terhangat per kategori setiap hari
(Politik, Teknologi, Ekonomi, Olahraga, Lingkungan, dll)
         ↓
[TOPIC GENERATOR — LLM]
Generate satu topik debat per kategori
Topik di-lock dan disimpan di database untuk hari itu
         ↓
[WEB APP — Frontend]
User buka app → sistem random assign satu kategori
User dapat topik hari itu
User pilih mode: Devil's Advocate / Fixed Position
         ↓
[SESI DEBAT — 3 Ronde]
Ronde N:
  1. AI (LLM) sampaikan argumen/counter-argument
  2. User ketik respons argumen
  3. Argumen user dievaluasi:
     - Opsi A: LLM evaluasi langsung → feedback + score
     - Opsi B: IndoBERT scorer → score; LLM → feedback naratif
  4. Tampilkan feedback + score ronde ke user
         ↓
[AKHIR SESI]
Summary feedback keseluruhan
Total score (agregat dari 3 ronde)
```

---

### 4.3 Prompt Engineering (Opsi A maupun B)

Meskipun LLM digunakan, prompt engineering yang terstruktur adalah kontribusi teknis yang signifikan. Setiap role memiliki system prompt yang berbeda:

**Topic Generator prompt:**
```
Dirancang untuk menghasilkan topik debat yang:
- Spesifik dan bisa diperdebatkan (bukan fakta)
- Relevan dengan isi berita
- Sesuai untuk debat 3 ronde
- Dalam Bahasa Indonesia
```

**Debate Opponent prompt:**
```
Dirancang untuk:
- Mempertahankan posisi secara konsisten sepanjang sesi
- Tidak keluar dari konteks topik
- Menyesuaikan intensitas argumen per ronde
- Menggunakan Bahasa Indonesia formal
```

**Argument Evaluator prompt (Opsi A):**
```
Dirancang untuk output terstruktur:
{
  "relevansi": 0.0-1.0,
  "koherensi": 0.0-1.0,
  "kekuatan_bukti": 0.0-1.0,
  "feedback": "teks feedback naratif"
}
```

---

## 5. Dataset

### Opsi A — Full LLM API

| Sumber | Digunakan untuk |
|---|---|
| **News API / GNews API / Mediastack** | Fetch berita harian per kategori — input untuk topic generation |

Tidak ada dataset training karena tidak ada model yang dilatih.

---

### Opsi B — Hybrid LLM + IndoBERT

| Sumber | Konten | Digunakan untuk |
|---|---|---|
| **News API / GNews API** | Berita harian per kategori | Input topic generation |
| **Synthetic dataset (LLM-generated)** | 500–1000 contoh argumen Bahasa Indonesia berlabel | Fine-tuning IndoBERT sebagai argument quality scorer |
| **IndoNLI (opsional, tambahan)** | Natural Language Inference Bahasa Indonesia | Pre-training signal tambahan untuk IndoBERT |

**Proses pembuatan synthetic dataset:**
```
1. Kumpulkan N topik debat (dari run awal sistem atau manual)
2. Prompt LLM untuk generate contoh argumen per topik:
   - Argumen lemah (weak): tidak relevan, tidak logis, tanpa bukti
   - Argumen sedang (medium): relevan tapi kurang logis atau kurang bukti
   - Argumen kuat (strong): relevan, logis, disertai bukti/reasoning
3. Review sampel untuk quality control
4. Gunakan sebagai training data untuk fine-tune IndoBERT
```

---

## 6. Flow Aplikasi

### 6.1 Target User

Pengguna berbahasa Indonesia yang ingin melatih kemampuan berpikir kritis dan berargumentasi — mulai dari mahasiswa, profesional muda, hingga siapapun yang tertarik dengan isu-isu terkini dan ingin meningkatkan kemampuan debat mereka secara mandiri, kapan saja, tanpa butuh lawan bicara manusia.

### 6.2 Flow Penggunaan Aplikasi

```
[1] User buka ArgueDaily (web app)
         ↓
[2] Sistem cek: apakah user sudah main hari ini?
    ├── Sudah → tampilkan hasil sesi hari ini
    └── Belum → lanjut ke step 3
         ↓
[3] Sistem random assign satu kategori ke user
    Tampilkan:
    - Kategori yang didapat (misal: "Teknologi")
    - Topik debat hari ini
    - Kutipan singkat dari berita sumber
         ↓
[4] User pilih mode debat:
    [Devil's Advocate] atau [Fixed Position]
         ↓
[5] Sesi debat dimulai — Ronde 1 dari 3
    AI menyampaikan argumen pembuka
         ↓
[6] User mengetik argumen/respons
    Klik [Kirim Argumen]
         ↓
[7] Sistem evaluasi argumen user:
    - Score relevansi, koherensi, kekuatan bukti
    - Feedback naratif singkat per dimensi
    Tampilkan hasil evaluasi ronde 1
         ↓
[8] Lanjut ke Ronde 2 → (ulangi step 5-7)
         ↓
[9] Lanjut ke Ronde 3 → (ulangi step 5-7)
         ↓
[10] Akhir sesi — tampilkan:
    - Summary feedback keseluruhan
    - Score per ronde (grafik/visualisasi)
    - Total score akhir
    - "Kembali besok untuk topik baru!"
```

### 6.3 Stack Teknologi

| Komponen | Teknologi |
|---|---|
| Frontend | React.js / Next.js |
| Backend | Python + FastAPI |
| Database | PostgreSQL (simpan topik harian, hasil sesi user) |
| News Fetching | News API / GNews API / Mediastack (free tier tersedia) |
| LLM API | Google Gemini (free tier) atau Groq (free tier) |
| Fine-tuned Model (Opsi B) | IndoBERT via HuggingFace Transformers |
| Scheduler (topic generation) | Cron job harian — generate & lock topik setiap pukul 00.00 |

