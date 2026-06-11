# TRD-03 — Keamanan Konten · debat.in

| | |
|---|---|
| **Komponen** | Keamanan konten (lintas-komponen) |
| **Versi** | 1.0 · Draft |
| **Acuan** | TRD-02 (pipeline), TRD-04 (persona), TRD-06 (lapor); SRS FR-19…FR-27, NFR-4…NFR-7 |

> Komponen **lintas-bidang**: menempel di pipeline (Gerbang 1–2), di mesin sesi (pengaman argumen AI), dan di pelaporan (Gerbang 3). Dokumen ini memusatkan **mekanisme & aturan**; komponen lain memanggilnya.

---

## 1. Prinsip Inti

> Debat boleh menyerang **ide & kebijakan** sekeras apa pun. **Tidak boleh**: menjadikan **keberadaan/martabat sekelompok orang** sebagai mosi, atau **penderitaan korban** sebagai bahan. Pendekatan **blacklist target** (buang yang spesifik berbahaya), **bukan whitelist** — isu berat (sosial, politik, agama-dalam-kebijakan) tetap boleh & diinginkan.

Garis penentu: *objek yang diperdebatkan* = **kebijakan/ide** (boleh) vs **kelayakan/keberadaan/penderitaan manusia** (tidak).

---

## 2. Gerbang 1 — Filter Berita (di pipeline, TRD-02 §2b)

Menolak **artikel** sebelum jadi mosi. Dijalankan dalam panggilan generate (TRD-02 §5, langkah 1–2).

| Tolak jika artikel… | Alasan |
|---|---|
| menyangkut **perkara hukum dengan nama individu belum divonis** | trial-by-public, risiko pencemaran |
| **non-debatable** (peristiwa murni: skor bola, seremoni, lap. cuaca) | tak ada dua sisi → bukan mosi |

Output: `{"reject":"named_legal"|"non_debatable"}` → artikel dilewati.

> **Tragedi TIDAK diblokir di Gerbang 1.** Tragedi disaring di Gerbang 2 berdasarkan *fokus* mosi, bukan keberadaan beritanya — karena berita bencana sah melahirkan mosi kebijakan.

---

## 3. Gerbang 2 — Tes Martabat + Reframe (per kandidat mosi, TRD-02 §5 langkah 4)

Tiga lapis, dievaluasi per kandidat:

### 3.1 Objek (VETO)
- Objek = kebijakan/institusi/ide → **lolos**.
- Objek = kelayakan/keberadaan kelompok manusia → **gagal** → ke Reframe (§3.4).

### 3.2 Arah (VETO)
- Mendebatkan **cara memperlakukan** kelompok (mis. "wajibkan kuota disabilitas") → **lolos**.
- Mendebatkan **apakah kelompok berhak** atas perlakuan dasar / kelayakan → **gagal** → Reframe.

### 3.3 Beban (FLAG, bukan veto)
- Jika mosi menyentuh kondisi personal kelompok rentan (penyakit, identitas bawaan) → set `flags.beban=true`.
- **Mosi tetap tayang.** Flag memicu **aturan stance** di TRD-04 §3 (AI tidak ditempatkan menyerang kondisi itu). Bukan alasan membuang.

### 3.4 Reframe-first
- Kandidat yang gagal §3.1/§3.2 **tidak langsung dibuang** — LLM menulis ulang framing: geser objek dari kelompok → kebijakan/institusi.
  - Pola: *"apakah kelompok X [layak]"* → *"apakah [institusi] seharusnya [tindakan] terhadap situasi X"*.
- Jika hasil reframe **lolos** §3.1/§3.2 → pakai versi reframed (`flags.reframed=true`).
- Jika reframe **tetap gagal** → `reject` → dibuang (tidak masuk antrian).

### 3.5 Tragedi (kunci FOKUS, tanpa kalender)
- Objek = **penderitaan korban** sebagai bahan → **reject selamanya** (tanpa batas waktu).
- Objek = **kebijakan** yang lahir dari tragedi (mis. "standar bangunan tahan gempa wajib diperketat") → **lolos kapan pun**, termasuk hari pertama.
- **Tidak ada** pelacakan tanggal kejadian, jendela hari, atau penundaan.

---

## 4. LLM-Pengkritik — Framing Licik di Premis

Menangkap mosi yang **lolos struktur** tapi menyelipkan penghakiman di premis (mis. *"...karena bikin masyarakat malas"*).

- **Implementasi default:** instruksi pengkritik **digabung** ke panggilan generate (TRD-02 §5) sebagai kriteria reject tambahan — hemat panggilan.
- **Opsi pemisahan tegas:** panggilan kedua khusus pengkritik atas kandidat yang sudah lolos (audit independen). Pilih bila tim ingin lapisan terpisah; biaya +1 panggilan/kategori/hari (masih flat).
- Output: tolak kandidat dengan premis menghakimi; boleh sarankan revisi premis.

---

## 5. Pengaman Argumen AI (di mesin sesi, TRD-04)

Karena AI **ikut berargumen** sebagai lawan, argumennya sendiri bisa tergelincir. Dua lapis:

### 5.1 Klausa prompt persona (lapis utama — selalu ada)
Semua persona membawa aturan tetap di system prompt:
- Serang **argumen/logika/bukti**, **tidak pernah pribadi/kelompok**.
- Bela posisi lewat **kebijakan/konsekuensi/nilai**, **bukan** merendahkan siapa pun.
- Jika posisi menyentuh kelompok rentan → argumentasikan dari sisi **sistemik** (biaya, implementasi, trade-off), bukan "kelayakan" kelompok.

### 5.2 Pemilihan stance sadar-beban (lapis struktural)
- Untuk mode **Berpendirian**, `ai_position` ditentukan saat promote (TRD-02 §5 / TRD-04 §2).
- Jika `flags.beban=true` → pilih posisi yang **tidak** menempatkan AI sebagai penyerang kondisi personal kelompok terkait.
- Mode **Kontrarian** secara desain lebih aman (AI mengambil lawan dari posisi user — user selalu bebas memilih sisinya).

---

## 6. Gerbang 3 — Pelaporan (di TRD-06)

Dua jalur berbeda penanganan:

| Target | Aksi | Ambang |
|---|---|---|
| **Mosi** (`report.target_type='motion'`) | `report_count++`; jika ≥ `REPORT_RETIRE_THRESHOLD` (=3 laporan **unik**) → `status='retired'`; kategori fallback ke antrian/statis hari itu | 3 |
| **Respons AI** (`target_type='ai_response'`) | Simpan dengan `session_id` (konteks) untuk **tinjauan tim**; **tidak** auto-retire | — |

- "Laporan unik" ditegakkan `uq_report_unique (motion_id, uid)` (TRD-01).
- `report_count` di-update server-side (service role) saat insert laporan baru.

---

## 7. Yang TIDAK Ada (keputusan eksplisit)

- **Tanpa approval manusia harian** — diganti gerbang otomatis + lapor.
- **Tanpa whitelist domain sempit** — yang disaring *framing & target*, bukan topiknya. 5 kategori tetap luas.
- **Tanpa kunci waktu untuk tragedi** — hanya kunci fokus.

---

## 8. Ringkas Titik Integrasi

| Gerbang/Lapis | Lokasi panggilan | Komponen |
|---|---|---|
| Gerbang 1 | generate prompt langkah 1–2 | TRD-02 §5 |
| Gerbang 2 (objek/arah/beban/reframe/tragedi) | generate prompt langkah 4 | TRD-02 §5 |
| LLM-pengkritik | generate (gabung) / panggilan kedua (opsi) | TRD-02 §5 / §4 |
| Pengaman argumen AI | system prompt persona + pemilihan stance | TRD-04 §2–3 |
| Gerbang 3 (lapor) | endpoint `/api/report` | TRD-06 / TRD-07 |
