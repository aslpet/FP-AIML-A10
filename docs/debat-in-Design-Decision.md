# Design Decision — debat.in

*Dokumen kanon desain untuk Final Project AI/ML — **debat.in**. Memuat seluruh keputusan produk & teknis sebagai satu sumber kebenaran untuk tim. Semua keputusan di sini sudah terkunci kecuali yang ditandai eksplisit sebagai opsional/putusan development.*

**Konsep produk:** aplikasi web pelatihan argumentasi berbasis gamifikasi (mekanik harian ala Wordle) — user beradu argumen melawan AI sebagai lawan debat, dalam Bahasa Indonesia, dengan topik harian yang bersumber dari berita terkini.

---

## 0. Stack Final (Terkunci)

| Lapisan | Teknologi |
|---|---|
| Frontend | **Next.js + React + TailwindCSS** |
| Backend | **Next.js** (API routes / fullstack — satu proyek dengan FE) |
| Database + Auth | **Supabase** (PostgreSQL + anonymous auth + Google OAuth dalam satu layanan) |
| LLM | **Google Gemini** (Flash; satu API key, nama model di config terpusat) |
| Scheduler | Cron (mis. Vercel Cron / penjadwal host) — **perlu dipastikan andal**, generate tidak boleh bergantung "ada yang buka app" |
| IndoBERT (opsional) | **Python + FastAPI** sebagai microservice terpisah (lihat §10) |

Catatan cron: karena BE memakai Next.js, penjadwalan harian bergantung host. Pastikan mekanisme cron sejak awal agar pipeline harian berjalan otomatis.

---

## 1. Persona AI — Lawan Debat Bermode (Pilar 1)

AI berperan sebagai **lawan debat aktif** (bukan coach yang selalu di pihak user). **Tidak ada pemilihan mode oleh user** — sistem mengundi persona secara acak saat sesi dimulai (lihat §4 untuk granularitas acak).

Persona = kombinasi **dua sumbu**:

### Sumbu A — Stance Policy (cara menentukan sisi)
- **Kontrarian** — selalu mengambil sisi berlawanan dari argumen terakhir user.
- **Berpendirian** — mengunci satu posisi sejak awal, konsisten sepanjang sesi (posisi ditentukan sistem saat mosi dipromosikan, bukan reaksi ke user).

### Sumbu B — Gaya Retorika (cara menyerang) — 5 gaya
1. **Sang Penuntut** — agresif langsung; menyerang klaim terkuat user lebih dulu.
2. **Sang Skeptis (Sokratik)** — menghancurkan lewat pertanyaan ("apa buktimu?", "premis mana yang menjamin itu?").
3. **Sang Pragmatis** — menyerang dari kelayakan dunia nyata ("siapa yang membiayai? bagaimana penegakannya?").
4. **Sang Idealis/Prinsipil** — menyerang dari nilai ("sekalipun efektif, apakah adil?").
5. **Sang Analis Data** — menuntut bukti & menggugat generalisasi. **PENTING:** menyerang *struktur penalaran*, **TIDAK memvalidasi kebenaran faktual** (tidak butuh fact-check/search; tidak mengklaim data user salah, hanya menggugat kelengkapan/logikanya).

5 gaya × 2 stance = 10 rasa sesi dari komponen sedikit (tiap gaya = satu blok system prompt).

### Aturan lintas-persona (berlaku untuk semua)
- **Keras ke argumen, tidak pernah ke orang** — serang klaim/logika/bukti, jangan merendahkan user.
- **Gaya menetap sepanjang sesi; isi & intensitas serangan adaptif.** Karakter lawan konsisten, tetapi tiap sanggahan merespons argumen user barusan; intensitas membaca kekuatan argumen (lemah → serangan membuka jalan; kuat → serangan penuh). "Kepribadian tetap, tapi dia mendengarkan."
- **Evaluator terpisah & netral dari persona** — skor user **tidak boleh** tergantung persona yang kebetulan didapat. Pemisahan peran lawan vs juri dijadikan prinsip arsitektur sejak Fase 1 (evaluator menilai argumen vs mosi, tidak tahu/tidak peduli posisi yang dibela AI).

---

## 2. Struktur Sesi — Debat Bounded 3 Ronde (Pilar 2)

Alur (3 giliran user, AI membuka & menutup):

```
[AI]   Argumen pembuka (sesuai persona + stance, berdasarkan mosi)
[User] Argumen #1
[AI]   Tanggapan #1 (menyerang/merespons, TANPA skor)
[User] Argumen #2
[AI]   Tanggapan #2 (TANPA skor)
[User] Argumen #3
[AI]   Tanggapan PENUTUP + feedback + PENILAIAN (sekali, di akhir)
```

- **Penilaian HANYA di akhir** (bukan per ronde) — evaluator menilai **keseluruhan pertukaran**, memungkinkan dimensi Responsiveness (lihat §3) yang hanya bisa dinilai lintas-ronde.
- Bounded pada **maksimal 3 ronde** (tidak berputar terbuka).

---

## 3. Skema Penilaian (Pilar 3)

Empat dimensi, dinilai sekali di akhir atas keseluruhan pertukaran:

| Dimensi | Mengukur | Bobot |
|---|---|---|
| **Penalaran** | Klaim jelas, alur logis, ditopang alasan/contoh (koherensi + dukungan dilebur) | **35%** |
| **Relevansi** | Argumen diarahkan ke **mosi** (berfungsi sebagai gate) | **25%** |
| **Responsiveness** | Argumen diarahkan ke **sanggahan lawan** — bertahan/beradaptasi vs kabur dari serangan | **25%** |
| **Kejelasan** | Penyampaian: keterbacaan, struktur, bahasa | **15%** |

- **Skala 1–5 per dimensi dengan anchor eksplisit** tiap level (bukan 1–10 atau 0–100 bebas — LLM lebih konsisten di skala kecil ber-anchor). Satu skala internal, satu skala tampilan.
- **Tampilan ke user: 0–100** (weighted-sum di-rescale).
- **Gate relevansi:** Relevansi ≤ 2 → skor total di-cap/diperkecil.
- **Disimpan ML-ready:** skor per-dimensi + `rationale` per dimensi + `rubric_version` + `model_version`.
- **Penalaran dilebur (4 dimensi, bukan 5).** Jika tim ingin memisahkan "Kekuatan Bukti" sebagai dimensi ke-5 (selaras persona Analis Data), itu sah dengan penyesuaian bobot — tetapi default = 4 dimensi.

---

## 4. Topik Harian & Pipeline Mosi (Pilar 4)

### Kategori (5, cakupan eksplisit — "label", bukan pembatas)
| Kategori | Cakupan |
|---|---|
| **Politik & Hukum** | kebijakan negara, regulasi, pemerintahan |
| **Ekonomi** | makro, ketenagakerjaan, bisnis, fiskal |
| **Teknologi** | digital, AI, platform, data |
| **Sosial & Pendidikan** | pendidikan, kesehatan publik, kehidupan urban, budaya |
| **Lingkungan** | iklim, energi, tata ruang, konservasi |

Berita lintas-kategori di-assign ke kategori dominannya.

### Rotasi harian
- **Pilih 4 dari 5 kategori** tiap hari (random pick). Menambah kejutan ala Wordle + efisiensi tipis.
- **Pagar keadilan:** tidak ada kategori yang absen lebih dari **2 hari berturut** (rotasi berbobot: yang lama tak muncul diprioritaskan) — supaya antrian kategori "istirahat" tidak mati kena TTL.

### Pemilihan & pembuatan mosi (per kategori aktif, batch/cron harian)
```
RSS kategori → artikel ≤48 jam
  → pilih 1 berita paling debatable (lolos Gerbang 1, §5)
  → generate SAMPAI 3 kandidat mosi (sudut kebijakan/fakta/nilai)
     + skor kelayakan tiap kandidat + veto keamanan (§5)   ← SATU panggilan LLM
  → kandidat tertinggi yang lolos → MOSI LIVE hari ini
     (tie-break: bentuk klaim beda dari mosi kemarin di kategori itu)
  → sisanya yang lolos → ANTRIAN
```

**Kriteria skor kelayakan** (di prompt): (1) keseimbangan dua sisi, (2) aksesibilitas (nalar umum, tanpa pengetahuan spesialis), (3) kejelasan proposisi (cukup spesifik agar Relevansi bisa dinilai), (4) daya cengkeram/engagement.

### Hierarki sumber (kesegaran = default)
1. **Jalur utama:** mosi dari berita ≤48 jam (selalu dicoba dulu).
2. **Cadangan — antrian:** hanya dilirik jika jalur utama gagal hari itu. **LIFO** (ambil kandidat **termuda**), **TTL 3 hari** (kandidat >3 hari di-retire tanpa tayang).
3. **Jaring terakhir:** fallback statis (mosi timeless cadangan).

> Antrian = **buffer bergulir berumur pendek**, bukan perpustakaan permanen. Kandidat ke-2/ke-3 dari berita hari ini biasanya tayang 1–2 hari berikutnya (masih segar). Yang di-refresh harian = **mosi**, bukan berita; berita boleh "terpakai ulang" selama sudut/bentuk klaimnya berbeda (+ persona baru menempel ke mosi baru).

### Bentuk mosi (3 bentuk klaim) + contoh
Mosi = proposisi (pernyataan atau pertanyaan argumentatif) + **konteks netral** (1–2 kalimat latar, tidak memihak).

**Contoh 1 — berita Ekonomi/Teknologi:** *"Pemerintah berencana mewajibkan ojek online beralih ke kendaraan listrik mulai 2027."*
- Kebijakan: *"Kewajiban kendaraan listrik untuk ojek online seharusnya ditunda hingga infrastruktur pengisian daya merata."*
- Fakta: *"Elektrifikasi ojek online akan menurunkan pendapatan driver dalam lima tahun pertama."*
- Nilai: *"Mana yang lebih layak diprioritaskan: percepatan target iklim atau perlindungan pendapatan driver?"*

**Contoh 2 — berita Pendidikan:** *"Sejumlah kampus mulai mengizinkan penggunaan AI dalam tugas dengan syarat disclosure."*
- Kebijakan: *"Kampus seharusnya mengizinkan penggunaan AI dalam tugas selama dideklarasikan."*
- Fakta: *"Penggunaan AI dalam tugas akan menumpulkan kemampuan menulis mahasiswa."*
- Nilai: *"Apakah kejujuran akademik lebih penting daripada kesiapan menghadapi dunia kerja yang memakai AI?"*

### Assignment & mekanik harian
- User buka app → **diundi SATU kategori aktif** (oleh server, tercatat, terkunci — anti-reroll) → menerima **mosi live + persona** kategori itu.
- **Shared per-kategori:** semua user yang dapat kategori sama → mosi + persona **identik** (shared experience ala Wordle). Hanya satu lapis acak (kategori), **bukan** dua (mosi tidak diacak lagi per-user).
- **Satu topik = selesai harian** (cukup untuk streak). Sisanya **bonus opsional:** lanjut ke kategori aktif lain yang belum dikerjakan — **berurutan, wajib selesai, tanpa balik**. Batas alami = jumlah kategori aktif (4).

---

## 5. Keamanan Konten (Pilar 5)

**Prinsip:** debat boleh menyerang **ide & kebijakan** sekeras apa pun; **tidak boleh** menjadikan **keberadaan/martabat sekelompok orang** sebagai mosi, atau menjadikan **penderitaan korban** sebagai bahan. Pendekatan **blacklist target** (buang yang spesifik berbahaya), **bukan whitelist sempit** — isu berat (sosial, politik, agama-dalam-kebijakan) tetap boleh & diinginkan.

### Gerbang 1 — Filter Berita (kasar, di depan; menumpang panggilan pemilihan berita)
Buang artikel yang: **perkara hukum menyebut nama individu belum divonis**; **murni peristiwa non-debatable** (skor bola, seremoni).

### Gerbang 2 — Tes Martabat + LLM-Pengkritik (halus, per-kandidat; menumpang panggilan generate+rank)
- **Objek** (kebijakan/ide vs kelompok manusia) → **VETO** jika objeknya kelompok.
- **Arah** (cara memperlakukan vs kelayakan/keberadaan) → **VETO** jika mendebatkan kelayakan.
- **Beban** (dampak personal ke user) → **FLAG, bukan veto** → memicu aturan stance (AI tidak ditempatkan membela sisi yang menyerang kondisi personal user). Mosi tetap tayang.
- **Premis licik** (framing menyelipkan penghakiman, mis. "...karena bikin masyarakat malas") → **tolak**.
- **Reframe-first:** kandidat yang gagal **TIDAK langsung dibuang** — LLM diminta menulis ulang framing-nya dulu (geser objek dari kelompok ke kebijakan/institusi). Hanya jika reframe juga gagal → dibuang. *Efek: isu panas tetap masuk lewat pintu yang benar; yang berubah cuma sudut kamera.*
- **Tragedi — kunci FOKUS saja (TANPA kunci waktu):** objek = penderitaan korban → **tolak selamanya**; objek = kebijakan/ide (mis. "standar bangunan tahan gempa wajib diperketat") → **boleh kapan pun, bahkan hari pertama**. Tidak ada pelacakan tanggal kejadian, tidak ada jendela hari, tidak ada penundaan — satu aturan universal berbasis fokus.

Kandidat gagal Gerbang 2 (setelah reframe) = dibuang, **tidak** masuk antrian.

### Gerbang 3 — Tombol Lapor (jaring belakang, setelah tayang)
- **Dua jalur:** (a) **mosi** dilaporkan → lewat ambang → **auto-retire** (untuk semua user), kategori fallback ke antrian/statis hari itu; (b) **respons AI** dilaporkan → tersimpan dengan konteks sesi untuk **ditinjau tim** (bahan perbaikan prompt + bukti mekanisme keamanan untuk laporan FP).
- **Ambang auto-retire: 3 laporan unik** (kecil, sesuai skala FP).

### Pengaman argumen AI (karena AI ikut berargumen sebagai lawan)
- **Klausa prompt persona:** semua persona membawa aturan tetap — serang argumen, jangan kelompok; bela posisi lewat kebijakan/konsekuensi/nilai, jangan lewat merendahkan; jika posisi menyentuh kelompok rentan, argumentasikan dari sisi sistemik (biaya/implementasi/trade-off), bukan "kelayakan" kelompok.
- **Pemilihan stance sadar-beban:** untuk mode Berpendirian, jika mosi menyentuh kelompok rentan (flag beban), stance AI dipilih yang **tidak** menempatkan AI sebagai penyerang kelompok itu.

**Tidak ada approval manusia harian** (kapasitas tim tidak memungkinkan) — digantikan gerbang otomatis + tombol lapor. **Tidak ada whitelist domain sempit** — yang disaring framing & target, bukan topiknya.

---

## 6. Identitas, Streak & History (Pilar 6)

Model Wordle: **anonim boleh, akun opsional.**

- **Identitas:** **anonymous auth** Supabase — user anonim dapat **uid persisten** otomatis (satu pemanggilan `signInAnonymously()`, tanpa form/registrasi). Refresh/tutup browser/kembali besok → uid tetap.
- **Akun (Google OAuth):** untuk streak & history persisten lintas-device. Upgrade anonim→akun = **link uid** (progress otomatis terbawa). **Status: fase lanjut/opsional** — di skala FP, penguji umumnya satu device, jadi uid anonim sudah menopang ~95% kebutuhan demo.
- **Streak: sekali per hari** (menyelesaikan minimal satu sesi). Sesi tambahan = bonus, tidak menambah streak.
- **Tanpa leaderboard** — skor personal (refleksi diri), bukan ranking.
- **Consent ringan** di main pertama: argumen dipakai untuk meningkatkan sistem.
- **Assignment kategori di backend, tercatat, terkunci** — pengundian dilakukan server & dicatat (`uid → kategori hari ini`), bukan di browser (cegah reroll via refresh).
- **Cek "sudah main hari ini":** backend membaca baris `(uid, tanggal, kategori)` — belum ada → undi & mulai; sudah ada → tampilkan hasil + tawarkan kategori aktif lain yang belum dimainkan.

### History view (tampilan ramping)
Daftar sesi: **mosi + kategori + skor total + 4 skor dimensi** + grafik tren dimensi lintas waktu. **Persona & stance DISIMPAN** (untuk analisis/masa depan) tetapi **TIDAK ditampilkan**. Analitik per-persona = dicoret dari scope.

### Share card (ramping, ala Wordle)
```
debat.in — 12 Jun
📁 Ekonomi
"Kewajiban kendaraan listrik untuk ojek online
 seharusnya ditunda hingga infrastruktur merata"
⚔️ 78/100
```
Memuat mosi (sebagai teaser — spoiler ringan tapi tidak merusak, karena tahu mosi duluan tidak otomatis membuat argumen bagus). Tanpa persona/stance.

### Verdict (elemen gamifikasi — putusan saat development)
Desain tersedia bila dipakai: di akhir sesi, sebelum rapor skor, hasil tanding diumumkan dalam bahasa tanding (mis. **"Argumen Bertahan" / "Imbang Ketat" / "Argumen Runtuh"**), **3 tingkat**, ditentukan dari skor yang **sudah ada** (terutama Responsiveness + Penalaran) — **nol panggilan LLM tambahan**. Memberi klimaks pada sesi + drama pada share card. Status: diputuskan saat development.

**Out of scope (tegas):** profil/avatar, badge di luar streak, fitur sosial (follow/komentar), notifikasi/reminder.

### Audit gamifikasi (cukup untuk FP)
Loop utuh: **datang → bertanding → resolusi → pamer → besok lagi.** Dimiliki: ritual harian + kelangkaan, kejutan (kategori & persona acak), shared experience per-kategori, streak, share card, skor + breakdown, (opsional) verdict. Yang sengaja absen (leaderboard/XP/level/badge) = keputusan prinsip (skor personal), bukan kelupaan.

---

## 7. Arsitektur & Data (Pilar 7)

```
┌─ FRONTEND (Next + React + Tailwind) ────────────┐
│  arena debat · dashboard hasil · history · share │
└──────────────┬───────────────────────────────────┘
               │  (satu proyek Next.js — FE+BE, tanpa CORS)
┌─ BACKEND (Next.js API) ──────────────────────────┐
│  ① Pipeline harian (cron)                         │
│  ② Mesin sesi (assignment · persona · 3 ronde ·   │
│     evaluator terpisah)                           │
│  ③ Lapisan data                                   │
└───┬───────────────┬──────────────────┬────────────┘
    │               │                  │ (opsional, §10)
 [Gemini]      [Supabase]         [FastAPI/IndoBERT]
 Flash         PostgreSQL+Auth     microservice Python
```

### Skema data (4 entitas)
1. **`daily_motion`** — `motion_id`, `motion_text`, `context` (netral), `claim_form` (kebijakan/fakta/nilai), `category`, provenance (`source_title/url/outlet/date`, `source_id`), `status` (candidate→queued→live→retired), `live_date`, `persona`, `stance`, `safety_flags`, `report_count`, `created_at` (TTL 3 hari), `quality_score`.
2. **`session`** — kunci `(uid, tanggal, category)`; `motion_id`, transkrip ronde (argumen user ×3 + respons AI), 4 skor dimensi (1–5) + `rationale` per dimensi, `total_score` (0–100), feedback naratif, `verdict` (opsional), `rubric_version`, `model_version`.
3. **`user`** — `uid`, `streak_count`, `last_played_date`, status link Google (fase lanjut). Tanpa password, tanpa profil.
4. **`assignment`** — `(uid, tanggal) → category`, dicatat sekali & terkunci. (Bisa dilebur ke `session` — pilihan implementasi tim.)

Tidak ada tabel berita terpisah (denormalisasi — info berita ditempel ke mosi via `source_id`). Skema `session` per-dimensi + versioning = **ML-ready** (pintu IndoBERT terbuka tanpa perubahan skema).

### Model & disiplin token
| Tugas | Model |
|---|---|
| Pipeline harian (pilih berita + generate + rank + safety) | **Flash** |
| Persona per ronde (pembuka + 3 tanggapan) | **Flash** (butuh cepat; karakter via prompt) |
| Evaluasi akhir (4 dimensi + rationale + feedback) | **Flash dulu**; naikkan kelas hanya jika kualitas kurang |

- **Satu API key Gemini** untuk semua — model dipilih per-panggilan via parameter, **bukan key terpisah**. Nama model di **config terpusat** (mis. `MODEL_PIPELINE`, `MODEL_EVALUATOR`) agar mudah diubah satu baris.
- **Disiplin token:** (a) riwayat ronde untuk persona dikirim **ringkas** (ringkasan per giliran) — evaluator akhir tetap dapat **teks utuh user**; (b) output LLM ber-skema **JSON ketat** + pembersih ```json + fallback; (c) **retry with backoff** untuk rate limit (bottleneck realistis FP = request per menit saat demo serentak, bukan token bulanan).
- **Estimasi beban FP:** ~8 panggilan pipeline/hari (flat) + ~5 panggilan/sesi (skala dengan user) → puluhan user nyaman di **free tier**. Cost center sebenarnya = sesi, bukan pipeline.

---

## 8. Strategi Build / Phasing

| Fase | Isi |
|---|---|
| **Fase 1 — LLM-full (jalur utama yang sah)** | Produk berjalan utuh dengan Gemini: pipeline, persona, debat 3 ronde, evaluasi. **Bukan "MVP sementara" — ini jalur final yang diterima** (FP hanya mewajibkan ADA AI; LLM saja cukup). |
| **Fase 2 — IndoBERT (opsional, enhancement)** | Lihat §10. Boleh dikerjakan bila ada waktu; **tidak wajib**. |

**ML-ready dipertahankan** walau IndoBERT opsional: skor per-dimensi + versioning disimpan sejak Fase 1 (biaya ~nol, menjaga pintu terbuka, sekaligus dipakai history view).

---

## 9. Status Pilar — SEMUA TERKUNCI ✅

| Pilar | Status |
|---|---|
| 1. Persona AI (lawan bermode, acak per-topik, adaptif) | ✅ |
| 2. Struktur sesi (3 ronde, nilai di akhir) | ✅ |
| 3. Skema penilaian (4 dimensi 35/25/25/15) | ✅ |
| 4. Topik harian (5 kategori, rotasi 4, pipeline mosi) | ✅ |
| 5. Keamanan konten (3 gerbang + pengaman AI) | ✅ |
| 6. Identitas/streak/history | ✅ |
| 7. Arsitektur & data | ✅ |

**Putusan saat development (bukan blocker):** Verdict (desain siap); link Google OAuth (uid anonim cukup untuk demo); peleburan tabel `assignment`.

---

## 10. IndoBERT Argument Scorer — OPSIONAL (Enhancement)

> Status: **tidak wajib.** Dikerjakan hanya bila waktu memungkinkan. Bagian ini ditulis detail agar implementasi mudah bila jadi digarap.

### Tujuan & posisi
Memindahkan **sebagian penilaian angka** dari LLM ke model yang dilatih sendiri → penilaian lebih deterministik/reproducible & dapat dievaluasi kuantitatif (MAE/korelasi). Memperkuat proyek sebagai "AI/ML project" (ada model dilatih sendiri).

### Arsitektur integrasi
```
Next.js backend (evaluator)  ──HTTP internal──▶  FastAPI (Python)
   default: skor via LLM                            IndoBERT inference
   jika layanan ada: panggil untuk skor   ◀────────  (terima teks argumen → skor)
```
- Microservice **Python + FastAPI** (alasan: Pydantic untuk validasi kontrak skor, async untuk inference, auto-docs Swagger, standar de-facto ML serving).
- **TIDAK diekspos ke internet publik** — hanya dipanggil backend Next via jaringan internal/private.
- **Fallback otomatis:** jika layanan IndoBERT tidak ada/mati → evaluator LLM (Fase 1) tetap jalan. Nol perubahan pada komponen lain.

### Pembagian dimensi (penting)
- **IndoBERT pegang:** Penalaran, Relevansi, Kejelasan (dinilai dari teks argumen tunggal).
- **Responsiveness TETAP di LLM** — butuh memahami pertukaran multi-giliran, sulit untuk model kecil teks-tunggal.

### Dataset (LLM distillation)
1. Kumpulkan argumen Indonesia berkualitas bervariasi (lemah/sedang/kuat) — sumber: **tabel `session` yang sudah ML-ready** (data pemakaian riil) + generate sintetis via LLM (~500–1000 sampel, valid secara akademis).
2. Label per-dimensi via LLM kuat berbasis rubrik (anchor 1–5) → **silver labels**.
3. Label tangan ~100–200 sampel → **gold test set**.
4. Fine-tune IndoBERT (HuggingFace Transformers), laporkan **MAE/korelasi vs gold set**.
5. (Opsional) IndoNLI sebagai sinyal pre-training tambahan.

### Konsistensi
`rubric_version` & `model_version` (sudah disimpan tiap penilaian sejak Fase 1) memastikan label latih tidak tercampur antar versi rubrik.

---

## Langkah Berikutnya
Turunkan dokumen ini menjadi **PRD** dan **SRS** final debat.in, lalu **TRD** (desain teknis & skema DB rinci).
