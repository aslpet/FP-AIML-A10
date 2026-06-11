# Product Requirements Document (PRD) — debat.in

| | |
|---|---|
| **Produk** | debat.in — Pelatihan Argumentasi Berbasis Gamifikasi dengan Topik Harian dari Berita |
| **Jenis** | Web App (Final Project mata kuliah AI/ML) |
| **Versi dokumen** | 1.0 |
| **Status** | Draft untuk review kelompok |
| **Dokumen terkait** | Design Decision — debat.in; SRS; TRD (menyusul) |
| **Bahasa produk** | Bahasa Indonesia |

---

## 1. Ringkasan Eksekutif

**debat.in** adalah aplikasi web untuk melatih kemampuan berargumentasi melalui sesi **debat harian melawan AI**, dengan mekanik bergaya Wordle. Setiap hari sistem mengambil berita terkini per kategori, merumuskannya menjadi **mosi (topik debat)**, lalu user beradu argumen melawan AI yang berperan sebagai **lawan debat** dalam sesi terstruktur **3 ronde**. Di akhir sesi, AI menutup pertukaran sekaligus memberi **feedback dan penilaian kualitas argumen** lintas empat dimensi. Seluruh interaksi berlangsung dalam Bahasa Indonesia.

Produk menekankan **pembelajaran dan refleksi diri**, bukan kompetisi antar-user: tidak ada leaderboard, skor bersifat personal sebagai alat melacak perkembangan. Dari sisi akademik (AI/ML), inti AI dijalankan oleh **LLM (Gemini)** sebagai jalur utama yang sah; **argument quality scorer berbasis IndoBERT** tersedia sebagai *enhancement opsional* bila waktu memungkinkan.

**Tiga keunikan (novelty):**
1. **Topik harian dari berita terkini** per kategori — selalu relevan & kontekstual; user dengan kategori sama mendapat mosi & lawan identik (shared experience ala Wordle).
2. **AI sebagai lawan debat aktif berpersona** — bukan chatbot bebas atau coach pasif; AI mengambil posisi, menyerang argumen user dengan gaya retorika yang berkarakter, dan adaptif terhadap kekuatan argumen.
3. **Penilaian argumentasi terstruktur empat dimensi** — bukan umpan balik subjektif, melainkan skor terukur yang dapat dilacak lintas waktu.

---

## 2. Latar Belakang & Problem Statement

Kemampuan menyusun argumen yang logis, relevan, dan responsif terhadap sanggahan adalah keterampilan berpikir kritis yang penting di era informasi — namun jarang dilatih secara terstruktur di luar lingkungan akademis formal (klub debat, kompetisi). Hambatan utama:

- **Tidak ada sarana latihan argumentasi berbahasa Indonesia** yang interaktif dan berbasis AI.
- **Latihan konvensional menuntut lawan bicara manusia** — tidak bisa dilakukan kapan saja, mandiri.
- **Umpan balik kualitas argumen umumnya subjektif** dan tidak terstruktur.
- **Topik debat yang relevan & terkini sulit ditemukan** secara konsisten — sering usang.
- **Tidak ada mekanisme gamifikasi** yang membuat latihan terasa menarik dan punya urgensi harian.

**debat.in menjawab kelima hambatan ini** dalam satu produk: lawan AI yang tersedia 24/7, umpan balik terstruktur empat dimensi, topik segar harian dari berita nyata, dan loop gamifikasi harian yang membentuk kebiasaan.

---

## 3. Target User

| | |
|---|---|
| **Primer** | Pelajar/mahasiswa, profesional muda, dan individu yang ingin melatih berpikir kritis & argumentasi secara mandiri dan rutin. |
| **Karakteristik** | Berbahasa Indonesia; tertarik isu terkini; menyukai mekanik harian ringan; menginginkan friksi rendah (langsung main tanpa wajib mendaftar). |
| **Kebutuhan inti** | Tantangan singkat harian; lawan debat yang menantang namun tidak memusuhi; umpan balik kualitas yang terstruktur; kemampuan melihat perkembangan diri lintas waktu. |

**Anti-persona (bukan untuk):** pengguna yang mencari forum debat antar-manusia, kompetisi peringkat, atau diskusi terbuka tanpa struktur.

---

## 4. Tujuan Produk & Metrik Keberhasilan

| Tujuan | Indikator |
|---|---|
| Membentuk kebiasaan latihan harian | Retensi harian; panjang streak rata-rata |
| Memberi umpan balik yang bermakna | Rasio user menyelesaikan sesi 3 ronde penuh; kembali pada hari berikutnya |
| Penilaian yang konsisten | Stabilitas skor lintas waktu untuk argumen serupa; (opsional, jika IndoBERT) korelasi/MAE vs gold set |
| Topik selalu segar & relevan | Rasio mosi yang bersumber dari berita ≤48 jam (vs fallback) |
| Keamanan konten | Rasio mosi bermasalah yang lolos ditekan minimal; responsivitas auto-retire via laporan |

> **Catatan skala FP:** metrik bersifat indikatif (cohort uji terbatas: tim, dosen, penguji), bukan target produksi.

---

## 5. Scope

### In-scope (jalur utama — wajib)
- Topik debat harian dari berita per kategori + perumusan mosi oleh LLM + penguncian harian + fallback.
- Sesi debat terstruktur **3 ronde** melawan AI lawan berpersona.
- Penilaian **empat dimensi** (Penalaran, Relevansi, Responsiveness, Kejelasan) + skor agregat 0–100, dilakukan **di akhir sesi**.
- Dashboard hasil + feedback naratif.
- Pipeline berita otomatis (cron) + **lapisan keamanan konten** (tiga gerbang).
- **Identitas anonim** (uid persisten) + streak + history view.
- Tombol lapor (moderasi terdistribusi).
- Share card (loop viral ala Wordle).

### In-scope (opsional / enhancement)
- **Argument quality scorer berbasis IndoBERT** — menggantikan sebagian penilaian angka. **Tidak wajib.**
- **Akun Google (OAuth)** — streak & history persisten lintas-device.
- **Verdict** (vonis tanding) — lapisan presentasi gamifikasi.

### Out-of-scope
- Leaderboard / fitur kompetitif antar-user.
- Mode debat terbuka tanpa batas ronde.
- Pemilihan mode lawan oleh user (persona diundi sistem).
- Approval konten manual harian oleh tim.
- Aplikasi mobile native (fokus web).
- Profil/avatar, badge di luar streak, fitur sosial (follow/komentar), notifikasi/reminder.
- Difficulty rating per mosi.

---

## 6. Fitur & Requirement Produk

### 6.1 Tantangan Harian (Mekanik Wordle)
- Tersedia **5 kategori**: Politik & Hukum, Ekonomi, Teknologi, Sosial & Pendidikan, Lingkungan. Setiap hari **4 dari 5 kategori aktif** (rotasi acak; pagar: tidak ada kategori absen >2 hari berturut).
- Tiap kategori aktif memiliki **satu mosi live** per hari, **identik untuk semua user** di kategori itu (shared experience).
- User yang membuka app **diundi satu kategori aktif** secara acak (oleh server, **tercatat & terkunci** — tidak bisa di-reroll dengan refresh) dan menerima mosi + persona kategori tersebut.
- **Satu sesi selesai = selesai harian** (cukup untuk streak). Sesi tambahan bersifat **bonus opsional**: user boleh lanjut ke kategori aktif lain yang belum dikerjakan — **berurutan, wajib selesai, tanpa kembali** ke yang sudah dituntaskan. Batas alami = jumlah kategori aktif.

### 6.2 Sesi Debat Terstruktur — 3 Ronde
Alur (3 giliran user; AI membuka & menutup):
1. AI menyampaikan **argumen pembuka** (sesuai persona + posisi, berdasarkan mosi).
2. **Ronde 1–2:** user menulis argumen → AI menanggapi/menyerang (**tanpa skor**).
3. **Ronde 3:** user menulis argumen → AI menyampaikan **tanggapan penutup + feedback + penilaian** dalam satu langkah akhir.
- Sesi dibatasi **maksimal 3 ronde** (bounded, tidak berputar terbuka).
- **Penilaian hanya di akhir**, menilai **keseluruhan pertukaran** (memungkinkan dimensi Responsiveness yang menilai bagaimana user merespons sanggahan lintas ronde).

### 6.3 Persona AI — Lawan Debat Berkarakter
AI berperan sebagai **lawan debat aktif** (bukan coach). Persona **diundi acak per mosi** (semua user di mosi sama menghadapi lawan sama) dan **tidak dipilih user**.

Persona = kombinasi dua sumbu:
- **Stance policy:** *Kontrarian* (selalu mengambil sisi berlawanan dari argumen terakhir user) atau *Berpendirian* (mempertahankan satu posisi konsisten yang ditentukan sistem).
- **Gaya retorika (5):** *Sang Penuntut* (agresif langsung), *Sang Skeptis* (Sokratik, menggugat via pertanyaan), *Sang Pragmatis* (kelayakan dunia nyata), *Sang Idealis* (dimensi nilai/etika), *Sang Analis Data* (menggugat struktur penalaran & generalisasi — **tanpa memvalidasi kebenaran faktual**).

**Aturan perilaku (lintas semua persona):**
- **Keras ke argumen, tidak pernah ke orang** — serang klaim/logika/bukti, tidak merendahkan user.
- **Gaya menetap sepanjang sesi; isi & intensitas serangan adaptif** terhadap argumen user (argumen lemah → serangan membuka jalan; argumen kuat → serangan penuh). "Karakter tetap, tapi dia mendengarkan."
- Pada topik sensitif, AI **tidak ditempatkan membela sisi yang menyerang kondisi personal user**.

### 6.4 Penilaian Multi-Dimensi
Empat dimensi, dinilai sekali di akhir oleh **evaluator yang terpisah & netral dari persona** (skor tidak terpengaruh persona yang didapat user):

| Dimensi | Mengukur | Bobot |
|---|---|---|
| **Penalaran** | Klaim jelas, alur logis, ditopang alasan/contoh | 35% |
| **Relevansi** | Argumen diarahkan ke mosi (berfungsi gate) | 25% |
| **Responsiveness** | Argumen menjawab sanggahan lawan lintas ronde | 25% |
| **Kejelasan** | Penyampaian: keterbacaan, struktur, bahasa | 15% |

- Skala internal **1–5 per dimensi dengan anchor eksplisit**; ditampilkan ke user sebagai **skor 0–100** (weighted-sum di-rescale).
- **Gate relevansi:** Relevansi ≤ 2 → skor total di-cap/diperkecil.
- Setiap penilaian menyertakan **rationale per dimensi** + feedback naratif membangun.

### 6.5 Pipeline Berita & Pembuatan Mosi
Berjalan **batch/terjadwal (cron) harian**, per kategori aktif:
1. Ambil artikel terbaru (≤48 jam) dari RSS kategori.
2. Pilih satu berita paling debatable (lolos filter keamanan, §6.6).
3. **Generate sampai 3 kandidat mosi** lintas bentuk klaim (**kebijakan / fakta / nilai**) + skor kelayakan + veto keamanan — dalam satu panggilan LLM.
4. Kandidat terbaik → **mosi live** (tie-break: bentuk klaim beda dari mosi kemarin di kategori itu); sisanya → **antrian**.

**Hierarki sumber (kesegaran = default):**
- **Jalur utama** — mosi dari berita ≤48 jam (selalu dicoba dulu).
- **Cadangan** — antrian (LIFO/ambil termuda, **TTL 3 hari**), hanya dipakai bila jalur utama gagal hari itu.
- **Jaring terakhir** — fallback mosi statis (timeless).

**Bentuk mosi:** proposisi (pernyataan atau pertanyaan argumentatif) + **konteks netral** 1–2 kalimat (latar tanpa memihak). Contoh:
> Berita: *"Pemerintah berencana mewajibkan ojek online beralih ke kendaraan listrik mulai 2027."*
> - Kebijakan: *"Kewajiban kendaraan listrik untuk ojek online seharusnya ditunda hingga infrastruktur pengisian daya merata."*
> - Fakta: *"Elektrifikasi ojek online akan menurunkan pendapatan driver dalam lima tahun pertama."*
> - Nilai: *"Mana yang lebih layak diprioritaskan: percepatan target iklim atau perlindungan pendapatan driver?"*

### 6.6 Keamanan Konten
**Prinsip:** debat boleh menyerang **ide & kebijakan** sekeras apa pun; **tidak boleh** menjadikan **keberadaan/martabat sekelompok orang** sebagai mosi, atau **penderitaan korban** sebagai bahan. Pendekatan **blacklist target** (buang yang spesifik berbahaya), **bukan whitelist sempit** — isu berat tetap boleh & diinginkan.

Tiga gerbang:
- **Gerbang 1 — Filter berita:** buang perkara hukum dengan nama individu belum divonis + peristiwa non-debatable.
- **Gerbang 2 — Tes martabat + LLM-pengkritik (per kandidat mosi):** objek & arah = **veto** (jika mendebatkan kelayakan/keberadaan kelompok); beban personal = **flag** (memicu aturan stance, bukan membuang mosi); premis licik = tolak. **Reframe-first:** kandidat gagal ditulis ulang framing-nya dulu (geser objek ke kebijakan/institusi); hanya jika reframe gagal → dibuang. **Tragedi:** kunci **FOKUS saja** — objek penderitaan korban → tolak (kapan pun); objek kebijakan → boleh (kapan pun, tanpa batasan waktu).
- **Gerbang 3 — Tombol lapor (jaring belakang):** dua jalur — mosi dilaporkan → auto-retire (ambang **3 laporan unik**); respons AI dilaporkan → ditinjau tim.

**Pengaman argumen AI:** klausa prompt persona (serang argumen, bukan kelompok; bela posisi via kebijakan/konsekuensi/nilai) + pemilihan stance sadar-beban pada mosi yang menyentuh kelompok rentan.

### 6.7 Identitas, Streak & History
- **Anonim boleh, akun opsional.** User anonim mendapat **uid persisten** otomatis (anonymous auth), bisa langsung main tanpa mendaftar.
- **Streak:** dihitung **sekali per hari** (menyelesaikan minimal satu sesi).
- **History view:** daftar sesi (mosi + kategori + skor total + 4 skor dimensi) + grafik tren dimensi lintas waktu — alat refleksi diri.
- **Tanpa leaderboard** (skor personal).
- **Consent ringan** di main pertama: argumen dipakai untuk meningkatkan sistem.
- **(Opsional) Akun Google:** streak & history persisten lintas-device; upgrade dari anonim = link uid (progres terbawa).

### 6.8 Share & Verdict
- **Share card** (ala Wordle): tanggal + kategori + mosi + skor — dapat disalin untuk dibagikan. Mosi berfungsi sebagai teaser (spoiler ringan, tidak merusak).
- **(Opsional) Verdict:** vonis tanding di akhir sesi dalam bahasa tanding (mis. *"Argumen Bertahan" / "Imbang Ketat" / "Argumen Runtuh"*), 3 tingkat, ditentukan dari skor yang sudah ada (Responsiveness + Penalaran) — nol panggilan LLM tambahan. Memberi klimaks pada sesi & drama pada share card.

---

## 7. User Stories

- Sebagai **user baru**, saya bisa langsung mencoba satu debat tanpa membuat akun, agar friksi rendah.
- Sebagai **user harian**, saya mendapat satu mosi acak dari berita terkini dan beradu argumen 3 ronde melawan AI, lalu menerima skor + feedback agar tahu kualitas argumen saya.
- Sebagai **user**, saya menghadapi lawan AI dengan gaya berbeda tiap mosi, agar latihan terasa bervariasi dan menantang.
- Sebagai **user rajin**, saya bisa lanjut ke kategori lain yang belum saya mainkan hari itu.
- Sebagai **user yang melacak progres**, saya melihat riwayat skor per dimensi lintas waktu untuk tahu aspek mana yang perlu diperbaiki.
- Sebagai **user**, saya bisa membagikan hasil debat saya tanpa membocorkan performa.
- Sebagai **user**, saya bisa melaporkan mosi atau respons AI yang tidak pantas.
- Sebagai **user yang ingin progres permanen**, saya bisa membuat akun Google sehingga streak & riwayat tersimpan lintas-device (opsional).

---

## 8. Roadmap / Phasing

| Fase | Isi | Status AI/ML |
|---|---|---|
| **Fase 1 — LLM-full (jalur utama)** | Produk berjalan utuh dengan Gemini: pipeline mosi, persona, debat 3 ronde, evaluasi 4 dimensi, identitas/streak/history, keamanan konten, share. **Ini jalur final yang sah** (FP hanya mewajibkan ADA AI). | LLM (Gemini) |
| **Fase 2 — IndoBERT (opsional)** | Argument quality scorer dilatih sendiri menggantikan sebagian skor (Penalaran/Relevansi/Kejelasan; Responsiveness tetap LLM). Dataset: LLM distillation + data pemakaian. **Tidak wajib.** | IndoBERT (enhancement) |

> Skoring Fase 1 dirancang **ML-ready** (skor per-dimensi + versioning disimpan) — menjaga pintu IndoBERT terbuka tanpa perombakan, sekaligus dipakai history view. Biaya kesiapan ini ~nol.

---

## 9. Open Decisions — PERLU DIBAHAS DENGAN KELOMPOK

> Dipisah agar tidak terlihat sudah final.

1. **Dimensi penilaian: 4 vs 5.** Default 4 dimensi (Penalaran melebur koherensi + dukungan). Opsi memisahkan **"Kekuatan Bukti"** sebagai dimensi ke-5 (selaras persona Analis Data) → feedback lebih granular, tapi UI lebih ramai & bobot perlu disesuaikan. **Keputusan tim.**
2. **Verdict — dipakai atau tidak.** Desain siap (3 tingkat dari skor yang ada, nol biaya tambahan). Putusan saat development.
3. **Akun Google (OAuth).** uid anonim sudah menopang ~95% kebutuhan demo; link Google = nilai tambah lintas-device tapi opsional. Putusan saat development.
4. **Peleburan tabel `assignment`** ke `session` — pilihan implementasi teknis.

---

## 10. Asumsi & Batasan

- **Stack:** Next.js (FE + BE) + React + TailwindCSS; **Supabase** (PostgreSQL + auth); **Gemini** (Flash, satu API key, model per-config). IndoBERT opsional = microservice Python/FastAPI terpisah, tidak diekspos publik.
- **Cron andal wajib** — pipeline harian tidak boleh bergantung "ada yang buka app"; mekanisme penjadwalan dipastikan sejak awal.
- Penilaian & pemanggilan LLM **wajib di backend** (kredensial tidak terekspos ke client).
- Skala FP terbatas → penggunaan LLM kemungkinan dalam **free tier**; cost center utama = sesi (bukan pipeline).
- Produk & sumber berita berbahasa **Indonesia**.

---

## 11. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Sumber berita (RSS) / LLM gagal saat generate | Antrian (TTL 3 hari) + fallback mosi statis |
| Mosi sensitif/menyakitkan lolos otomatis | Tiga gerbang (filter berita + tes martabat/reframe + lapor) + pengaman argumen AI |
| Argumen AI sendiri tergelincir (karena AI kini berargumen) | Klausa prompt persona + pemilihan stance sadar-beban |
| Bias penilaian (lawan = juri) | Evaluator dipisah & netral dari persona sejak Fase 1 |
| Biaya/rate-limit LLM saat demo serentak | Generate batch (flat) + model Flash + retry-with-backoff; penilaian dapat dipindah ke IndoBERT |
| Mekanik harian bisa di-reroll | Assignment kategori diundi & dicatat di backend, terkunci |
| Konsistensi data latih antar versi rubrik | `rubric_version` & `model_version` disimpan tiap penilaian |
| IndoBERT tidak selesai tepat waktu | Opsional sejak awal; Fase 1 (LLM-full) sudah produk utuh |

---

## 12. Langkah Berikutnya
Penyusunan **SRS** (kebutuhan fungsional & non-fungsional yang dapat diverifikasi), lalu **TRD** (desain teknis, skema DB rinci, kontrak API, dan detail integrasi IndoBERT opsional).
