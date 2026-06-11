# Software Requirements Specification (SRS) — debat.in

| | |
|---|---|
| **Produk** | debat.in — Pelatihan Argumentasi Berbasis Gamifikasi dengan Topik Harian dari Berita |
| **Versi dokumen** | 1.0 |
| **Status** | Draft untuk review kelompok |
| **Acuan** | Design Decision — debat.in; PRD debat.in v1.0 |
| **Standar** | Struktur mengacu IEEE 830 (disesuaikan) |

---

## 1. Pendahuluan

### 1.1 Tujuan
Dokumen ini menetapkan kebutuhan perangkat lunak **debat.in** secara terverifikasi: kebutuhan fungsional, non-fungsional, antarmuka eksternal, dan data. Ditujukan untuk tim pengembang sebagai acuan implementasi dan pengujian, serta dasar penyusunan TRD.

### 1.2 Lingkup Produk
debat.in adalah aplikasi web yang menyajikan **mosi (topik debat) harian** dari berita terkini per kategori, menerima argumen tertulis user dalam **sesi terstruktur 3 ronde** melawan **AI sebagai lawan debat berpersona**, lalu memberi **tanggapan penutup + penilaian kualitas empat dimensi** di akhir sesi. Sistem mencakup pipeline kurasi mosi otomatis dengan pengaman keamanan konten, mekanik harian bergaya Wordle, manajemen identitas (anonim + akun opsional), pelacakan streak & riwayat, dan — secara opsional — model penilai argumen yang dilatih sendiri (IndoBERT). Seluruh interaksi berbahasa Indonesia.

### 1.3 Definisi & Istilah
- **Mosi** — proposisi/pertanyaan argumentatif yang diperdebatkan pada satu kategori harian.
- **Bentuk klaim** — kategori proposisi: *fakta*, *nilai*, atau *kebijakan*.
- **Kategori** — domain isu yang terlihat user (Politik & Hukum, Ekonomi, Teknologi, Sosial & Pendidikan, Lingkungan).
- **Persona** — karakter lawan AI = kombinasi *stance policy* (Kontrarian/Berpendirian) × *gaya retorika* (5 gaya).
- **Ronde** — satu siklus argumen user → tanggapan AI; sesi terdiri atas maksimal 3 ronde.
- **Dimensi penilaian** — Penalaran, Relevansi, Responsiveness, Kejelasan.
- **Gate relevansi** — aturan yang membatasi skor total bila Relevansi sangat rendah.
- **Evaluator** — komponen penilai kualitas argumen, terpisah & netral dari persona (LLM; opsional IndoBERT).
- **Tes martabat** — prosedur tiga lapis (objek/arah/beban) penyaring mosi.
- **uid** — identitas pengguna persisten (anonim maupun akun).
- **Antrian** — buffer mosi cadangan berumur pendek (TTL 3 hari).
- **Fallback** — mosi statis cadangan saat sumber eksternal gagal.
- **Verdict** — vonis tanding (lapisan presentasi gamifikasi, opsional).

### 1.4 Referensi
Design Decision — debat.in; PRD debat.in v1.0; IEEE Std 830-1998.

### 1.5 Ikhtisar
Bagian 2 menjelaskan gambaran umum sistem; Bagian 3 memuat kebutuhan spesifik (fungsional, antarmuka, non-fungsional, data); Bagian 4 memuat use case utama; Bagian 5 ketertelusuran ke PRD.

---

## 2. Deskripsi Umum

### 2.1 Perspektif Produk
Aplikasi web fullstack berbasis **Next.js** (frontend + backend dalam satu proyek). Komponen eksternal: **Supabase** (PostgreSQL + auth), **penyedia LLM** (Gemini), **sumber berita** (RSS berbahasa Indonesia), dan — opsional — **layanan inference IndoBERT** (microservice Python/FastAPI). Penilaian & pemanggilan model berjalan di **backend** (tidak di client).

### 2.2 Fungsi Utama
Penyajian mosi harian dari berita; sesi debat 3 ronde melawan AI berpersona; penilaian empat dimensi di akhir sesi; kurasi & penjadwalan mosi dengan pengaman keamanan; manajemen identitas & sesi; streak, riwayat & share; pelaporan konten.

### 2.3 Karakteristik Pengguna
Pengguna umum berbahasa Indonesia, tanpa keahlian teknis khusus, mengakses lewat browser. **Tidak ada peran admin manual harian** untuk konten (kurasi otomatis + pelaporan terdistribusi). Tim pengembang dapat meninjau laporan konten secara berkala (bukan harian).

### 2.4 Batasan
- Penilaian & pemanggilan LLM **wajib di backend**.
- Autentikasi memakai managed service (Supabase) — sistem tidak membangun/menyimpan password sendiri.
- Bahasa konten: **Indonesia**.
- Pipeline harian **wajib berjalan terjadwal** (tidak dipicu kunjungan user).
- Tanpa leaderboard; tanpa mode debat terbuka tanpa batas; tanpa pemilihan persona oleh user; tanpa difficulty rating.

### 2.5 Asumsi & Ketergantungan
Ketersediaan layanan LLM (Gemini), Supabase, sumber berita RSS, dan — bila opsi diambil — layanan IndoBERT. Skala FP diasumsikan dalam batas free tier penyedia.

---

## 3. Kebutuhan Spesifik

> **Konvensi.** **FR** = Functional Requirement · **NFR** = Non-Functional Requirement · **DR** = Data Requirement · **EIR** = External Interface Requirement.
> **Prioritas:** **[M]** wajib (jalur utama) · **[S]** sebaiknya · **[O]** opsional/enhancement.

### 3.1 Kebutuhan Fungsional

#### A. Kategori, Rotasi & Penugasan Harian
- **FR-1 [M]** Sistem menyediakan **5 kategori** tetap (Politik & Hukum, Ekonomi, Teknologi, Sosial & Pendidikan, Lingkungan).
- **FR-2 [M]** Setiap hari sistem mengaktifkan **4 dari 5 kategori** secara acak (rotasi).
- **FR-3 [M]** Rotasi menjamin **tidak ada kategori absen lebih dari 2 hari berturut** (prioritas berbobot bagi kategori yang lama tak muncul).
- **FR-4 [M]** Setiap kategori aktif memiliki **tepat satu mosi live** per hari, **identik untuk semua user** pada kategori itu.
- **FR-5 [M]** Saat user membuka app pada hari berjalan, sistem **mengundi satu kategori aktif** untuk user dan **menguncinya** (assignment dicatat di backend, tidak berubah oleh refresh).
- **FR-6 [M]** Setelah user **menyelesaikan** sesi suatu kategori, sistem mengizinkan user melanjutkan ke **kategori aktif lain yang belum dikerjakan** hari itu, secara berurutan.
- **FR-7 [M]** Sistem **mencegah** user mengulang kategori yang sudah diselesaikan pada hari yang sama.
- **FR-8 [M]** Sistem menandai **penyelesaian harian** ketika user menuntaskan minimal satu sesi.

#### B. Pipeline Berita & Pembuatan Mosi
- **FR-9 [M]** Sistem **mengambil artikel terbaru** (≤48 jam) dari sumber berita RSS Bahasa Indonesia per kategori, secara **terjadwal (cron)**.
- **FR-10 [M]** Sistem **memilih satu berita paling debatable** per kategori (yang lolos Gerbang 1, FR-19).
- **FR-11 [M]** Sistem **menghasilkan hingga 3 kandidat mosi** dari berita terpilih lintas bentuk klaim (kebijakan/fakta/nilai), minimal 1, hanya yang lolos kualitas & keamanan.
- **FR-12 [M]** Sistem **memberi skor kelayakan** tiap kandidat (keseimbangan dua sisi, aksesibilitas, kejelasan proposisi, daya cengkeram) dan **memilih kandidat tertinggi** sebagai mosi live; kandidat lain yang lolos masuk **antrian**.
- **FR-13 [S]** Saat memilih mosi live, sistem menerapkan tie-break **bentuk klaim berbeda** dari mosi kemarin pada kategori yang sama.
- **FR-14 [M]** Setiap mosi terdiri atas **proposisi + konteks netral** (1–2 kalimat latar tanpa memihak).
- **FR-15 [M]** Bila jalur berita segar gagal pada suatu hari/kategori, sistem mengambil mosi dari **antrian** (kandidat **termuda** yang masih hidup).
- **FR-16 [M]** Mosi di antrian yang berumur **lebih dari 3 hari (TTL)** di-retire otomatis tanpa tayang.
- **FR-17 [M]** Bila antrian juga kosong, sistem menyajikan **mosi fallback statis**.
- **FR-18 [M]** Mosi mengikuti siklus status **candidate → queued → live → retired**.

#### C. Keamanan Konten
- **FR-19 [M]** **Gerbang 1 (filter berita):** sistem membuang artikel yang menyangkut **perkara hukum dengan nama individu belum divonis** dan peristiwa **non-debatable**.
- **FR-20 [M]** **Gerbang 2 (tes martabat):** sistem menolak kandidat mosi yang objek/arahnya mendebatkan **kelayakan/keberadaan kelompok manusia** (veto).
- **FR-21 [M]** Sistem menerapkan **reframe-first**: kandidat yang gagal tes martabat **ditulis ulang framing-nya** (menggeser objek ke kebijakan/institusi) sebelum dibuang; hanya jika reframe gagal → dibuang.
- **FR-22 [M]** Sistem memperlakukan **beban personal** sebagai **flag** (bukan veto) yang memicu aturan stance (FR-29), bukan membuang mosi.
- **FR-23 [M]** **Tragedi:** sistem menolak mosi yang menjadikan **penderitaan korban** sebagai objek (kapan pun), tetapi **mengizinkan** mosi berobjek **kebijakan** yang lahir dari tragedi (tanpa batasan waktu).
- **FR-24 [M]** Sistem menjalankan **LLM-pengkritik** untuk menolak mosi dengan **framing menyakitkan pada premis** (penghakiman kelompok terselubung).
- **FR-25 [M]** **Gerbang 3 (lapor):** sistem menyediakan aksi **lapor** pada mosi dan respons AI.
- **FR-26 [M]** Mosi yang melewati **ambang 3 laporan unik** di-**retire otomatis**; kategori terkait fallback ke antrian/statis hari itu.
- **FR-27 [S]** Laporan terhadap **respons AI** disimpan beserta konteks sesi untuk **ditinjau tim** (tidak auto-retire).

#### D. Sesi Debat & Persona
- **FR-28 [M]** Sistem **mengundi persona** (stance policy × gaya retorika) untuk tiap mosi; persona **identik untuk semua user** pada mosi itu dan **tidak dipilih user**.
- **FR-29 [M]** Untuk mode Berpendirian, sistem **menentukan posisi AI** saat mosi dipromosikan; bila mosi ber-flag beban, posisi dipilih agar AI **tidak menyerang kondisi personal** kelompok terkait.
- **FR-30 [M]** Sistem menghasilkan **argumen pembuka** AI sesuai persona & posisi terhadap mosi.
- **FR-31 [M]** Sistem menerima **argumen tertulis** user pada tiap ronde, beserta riwayat pertukaran dan nomor ronde.
- **FR-32 [M]** Pada **ronde 1–2**, AI menghasilkan **tanggapan/serangan tanpa skor**; pada **ronde 3**, AI menghasilkan **tanggapan penutup + feedback + penilaian**.
- **FR-33 [M]** Tanggapan AI **adaptif** terhadap argumen user (isi merespons argumen terakhir; intensitas mengikuti kekuatannya) sementara **gaya retorika menetap** sepanjang sesi.
- **FR-34 [M]** Tanggapan AI **menyerang argumen, bukan pribadi user**; tidak merendahkan user.
- **FR-35 [M]** Sesi dibatasi **maksimal 3 ronde** (bounded).

#### E. Penilaian
- **FR-36 [M]** Sistem menilai argumen pada **empat dimensi** (Penalaran, Relevansi, Responsiveness, Kejelasan), skala **1–5** dengan anchor, **sekali di akhir sesi** atas keseluruhan pertukaran.
- **FR-37 [M]** Penilaian dilakukan oleh **evaluator yang terpisah & netral** dari persona; skor tidak boleh bergantung pada persona yang didapat user.
- **FR-38 [M]** Sistem menghitung **skor agregat berbobot** (Penalaran 35%, Relevansi 25%, Responsiveness 25%, Kejelasan 15%) dan menampilkannya pada skala **0–100**.
- **FR-39 [M]** Sistem menerapkan **gate relevansi**: bila Relevansi ≤ 2, skor total di-cap/diperkecil.
- **FR-40 [M]** Sistem menyimpan **rationale per dimensi** + feedback naratif bersama skor.
- **FR-41 [O]** Penilaian dimensi Penalaran/Relevansi/Kejelasan dapat dihasilkan oleh **scorer IndoBERT**; Responsiveness tetap oleh LLM; tanggapan kualitatif tetap oleh LLM.

#### F. Identitas, Streak & Riwayat
- **FR-42 [M]** Sistem mengizinkan user **bermain anonim** dengan **uid persisten** tanpa pendaftaran.
- **FR-43 [M]** Sistem menghitung & menampilkan **streak harian** (sekali per hari).
- **FR-44 [M]** Sistem menampilkan **riwayat sesi** (mosi, kategori, skor total, 4 skor dimensi) dan **tren skor per dimensi lintas waktu**.
- **FR-45 [M]** Sistem menampilkan **pemberitahuan consent** bahwa argumen user dipakai untuk meningkatkan sistem (pada main pertama).
- **FR-46 [O]** Sistem mengizinkan **akun Google (OAuth)**; saat user anonim membuat akun, sistem **menautkan (link)** uid sehingga **progres terbawa**.

#### G. Hasil, Share & Verdict
- **FR-47 [M]** Sistem menampilkan **dashboard hasil** sesi: skor total 0–100, rincian 4 dimensi, dan feedback.
- **FR-48 [M]** Sistem menyediakan **share card** berisi tanggal + kategori + mosi + skor untuk disalin/dibagikan.
- **FR-49 [O]** Sistem menampilkan **verdict** (vonis tanding 3 tingkat) di akhir sesi, ditentukan dari skor yang sudah ada (tanpa panggilan LLM tambahan).

### 3.2 Kebutuhan Antarmuka Eksternal
- **EIR-1 [M]** **Supabase** — anonymous auth, Google OAuth (opsional), dan basis data PostgreSQL.
- **EIR-2 [M]** **Penyedia LLM (Gemini)** — generate/rank mosi, filter keamanan, argumen & tanggapan persona, evaluasi akhir. Diakses via **satu API key**; model dipilih per-panggilan dari konfigurasi.
- **EIR-3 [M]** **Sumber berita RSS** (berbahasa Indonesia) — ingest terjadwal.
- **EIR-4 [M]** **Antarmuka pengguna web** (browser), responsif.
- **EIR-5 [O]** **Layanan inference IndoBERT** (microservice Python/FastAPI), dipanggil backend via jaringan **internal/private** (tidak diekspos publik).

### 3.3 Kebutuhan Non-Fungsional

#### Kinerja
- **NFR-1 [S]** Tanggapan AI & penilaian dikembalikan dalam waktu wajar (target indikatif ≤ beberapa detik) pada kondisi normal.
- **NFR-2 [S]** Generate mosi berjalan **batch/terjadwal**, bukan per-request — biaya tidak meningkat seiring jumlah user.
- **NFR-3 [S]** Riwayat ronde untuk persona dikirim **ringkas**; evaluator akhir tetap menerima teks utuh user untuk dinilai.

#### Keamanan Konten & Etika
- **NFR-4 [M]** Sistem **tidak boleh menayangkan** mosi yang menjadikan martabat/keberadaan kelompok atau penderitaan korban sebagai objek debat.
- **NFR-5 [M]** Keamanan konten ditegakkan **berlapis** (tiga gerbang); kelolosan satu lapis tidak meniadakan lapis lain.
- **NFR-6 [M]** Argumen AI **tidak boleh menyerang pribadi/kelompok**; membela posisi hanya lewat kebijakan/konsekuensi/nilai.
- **NFR-7 [M]** Pengumpulan argumen user untuk pelatihan **disertai pemberitahuan consent** (FR-45).

#### Keamanan Sistem & Privasi
- **NFR-8 [M]** Autentikasi & sesi mengikuti managed service; sistem **tidak menyimpan password** sendiri.
- **NFR-9 [M]** Pemanggilan model & kredensial berjalan di **backend**; tidak terekspos ke client.
- **NFR-10 [O]** Layanan IndoBERT **tidak diekspos ke internet publik**.
- **NFR-11 [S]** Data argumen untuk pelatihan dikelola dengan **minimisasi data identitas**.

#### Reliabilitas & Ketersediaan
- **NFR-12 [M]** Kegagalan sumber berita/LLM **tidak menghentikan** penyajian mosi harian (antrian + fallback statis).
- **NFR-13 [M]** Output LLM diproses dengan **skema JSON ketat + pembersih + fallback** bila parsing gagal.
- **NFR-14 [S]** Pemanggilan LLM menerapkan **retry-with-backoff** untuk menghadapi rate limit.
- **NFR-15 [O]** Bila layanan IndoBERT tidak tersedia, penilaian **fallback otomatis** ke evaluator LLM.

#### Usabilitas
- **NFR-16 [M]** User dapat memulai sesi **tanpa pendaftaran** (friksi rendah).
- **NFR-17 [S]** Skor & feedback disajikan jelas (0–100 + rincian per dimensi); UI memberi indikator status (loading, "AI menganalisis", progres ronde) dan penanganan error.

#### Pemeliharaan & Konsistensi Data
- **NFR-18 [M]** Tiap penilaian menyimpan **`rubric_version` & `model_version`** agar label tidak tercampur antar versi.
- **NFR-19 [S]** Skoring Fase 1 dirancang **kompatibel** dengan skema scorer IndoBERT (per-dimensi) tanpa perombakan.
- **NFR-20 [S]** Nama model LLM **terkonfigurasi terpusat** (mis. variabel per peran), dapat diubah tanpa mengubah kode logika.

### 3.4 Kebutuhan Data

#### DR-1 — Entitas Mosi (`daily_motion`)
`motion_id`, `motion_text`, `context` (netral), `claim_form` (kebijakan/fakta/nilai), `category`, provenance (`source_title`, `source_url`, `source_outlet`, `source_date`, `source_id`), `status` (candidate/queued/live/retired), `live_date`, `persona`, `stance`, `safety_flags`, `report_count`, `created_at` (untuk TTL), `quality_score`.

#### DR-2 — Entitas Sesi/Penilaian (`session`)
Kunci **(uid, tanggal, category)**; satu user dapat memiliki beberapa baris pada tanggal sama. Field: `motion_id`, transkrip ronde (argumen user ×3 + respons AI), **skor per dimensi (1–5) + rationale**, `total_score` (0–100), feedback naratif, `verdict` (opsional), `rubric_version`, `model_version`, `created_at`.

#### DR-3 — Entitas User (`user`)
`uid` (anonim/akun), `streak_count`, `last_played_date`, status link Google (opsional). Tidak menyimpan password.

#### DR-4 — Entitas Penugasan (`assignment`)
`(uid, tanggal) → category`, dicatat sekali & terkunci. Dapat dilebur ke `session` (pilihan implementasi).

#### DR-5 — Dataset Latih IndoBERT (opsional)
Pasangan **(teks argumen Bahasa Indonesia → label per dimensi)**. Sumber: data pemakaian dari `session` (ML-ready) + synthetic LLM-generated (~500–1000 sampel) + gold test set label-tangan (~100–200); opsional IndoNLI.

#### DR-6 — Aturan Integritas
- Mosi dengan `source_id` sama = berasal dari satu berita; **maksimal satu yang `live`** per `live_date` per kategori.
- "Kategori aktif hari ini" = kategori dengan mosi `status=live` & `live_date`=hari ini.
- Assignment kategori user bersifat **unik & terkunci** per `(uid, tanggal)`.

---

## 4. Use Case Utama

- **UC-1 Bermain harian (anonim):** user membuka app → diberi uid anonim (jika baru) → diundi 1 kategori aktif → menerima mosi + persona → AI membuka → user beradu **3 ronde** → di ronde 3 menerima tanggapan penutup + skor 4 dimensi + feedback → ditandai selesai harian.
- **UC-2 Lanjut kategori (bonus):** setelah UC-1, user memilih lanjut → diberi kategori aktif lain yang belum dikerjakan → mengulang alur 3 ronde.
- **UC-3 Melihat hasil & berbagi:** user membuka dashboard hasil → melihat skor & feedback → menyalin **share card**.
- **UC-4 Melihat riwayat:** user membuka history → melihat daftar sesi & tren skor per dimensi lintas waktu.
- **UC-5 Membuat akun (opsional):** user anonim masuk dengan Google → uid ditautkan → streak & riwayat persisten lintas-device, progres terbawa.
- **UC-6 Melaporkan konten:** user menekan lapor pada mosi/respons AI → mosi: `report_count`++ → bila ≥ ambang, auto-retire; respons AI: disimpan untuk tinjauan tim.
- **UC-7 Kurasi otomatis (sistem):** scheduler harian → per kategori aktif: ingest RSS → Gerbang 1 → generate ≤3 mosi + skor + Gerbang 2 (tes martabat/reframe/pengkritik) → promote mosi live + persona → sisanya ke antrian (TTL 3 hari).
- **UC-8 Penilaian via IndoBERT (opsional):** argumen user dinilai scorer IndoBERT untuk Penalaran/Relevansi/Kejelasan; Responsiveness & feedback tetap LLM; bila layanan tak tersedia → fallback ke evaluator LLM.

---

## 5. Lampiran — Ketertelusuran ke PRD
Kebutuhan Bagian 3 menelusuri fitur PRD §6 (tantangan harian, sesi 3 ronde, persona, penilaian, pipeline & keamanan, identitas/streak/history, share/verdict) dan roadmap PRD §8 (penanda **[O]** untuk IndoBERT, akun Google, verdict). Open decisions PRD §9 (4 vs 5 dimensi, verdict, akun Google, peleburan tabel) berstatus keputusan kelompok/implementasi dan belum dikunci pada SRS ini. Angka indikatif (waktu respons NFR-1, ambang laporan FR-26) dapat dipatok final saat TRD.
