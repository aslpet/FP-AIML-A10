# FE Prototype Plan — debat.in (Blueprint untuk UI/UX)

| | |
|---|---|
| **Produk** | debat.in — Pelatihan Argumentasi Berbasis Gamifikasi dengan Topik Harian dari Berita |
| **Dokumen** | FE Prototype Plan — blueprint layar, fitur, & user flow untuk anggota UI/UX (A1) |
| **Versi** | 1.0 |
| **Acuan** | Design Decision; PRD v1.0; SRS v1.0; TRD-00…TRD-08; Implementation Plan |
| **Fokus** | Frontend saja — tanpa BE (data dummy/fixture, alur disimulasikan) |

---

## 1. Konteks

Anggota UI/UX (A1) butuh gambaran konkret: **layar apa saja yang harus didesain, fitur apa yang ditonjolkan, dan bagaimana sistem berjalan dari sisi user**. Dokumen ini menerjemahkan PRD/SRS/TRD menjadi blueprint FE — fokus tampilan & alur, **tanpa BE**.

Dikerjakan **dua tahap**:
- **Tahap A — Wireframe & Design System** (tanpa kode): sketsa semua layar + state, palet warna, tipografi, tone, inventory komponen, dan **naskah debat kalengan** (contoh mosi + dialog AI + skor).
- **Tahap B — Coded Prototype** (Next.js + Tailwind, mock data, **simulasi penuh**): semua layar bisa diklik; alur 3 ronde jalan dengan respons AI kalengan + delay "AI sedang menyusun argumen". Komponen dibuat agar **dipakai ulang** di produk (sinkron dengan M0/M1 Implementation Plan).

> Produk: web app pelatihan argumentasi bergaya Wordle — user beradu argumen 3 ronde melawan AI berpersona, mosi harian dari berita, dinilai 4 dimensi di akhir. Bahasa Indonesia, tone "tanding/arena".

---

## 2. ⚠️ Batasan Desain yang WAJIB Dipatuhi (jangan ikut dokumen ide lama)

Dokumen `final-project-ide2` (ArgueDaily) **usang** dan bertentangan dengan debat.in. Acuan = PRD/SRS/Design Decision/TRD. Yang **JANGAN** didesain:

| ❌ JANGAN | ✅ Yang benar (debat.in) |
|---|---|
| Layar pilih mode (Devil's Advocate / Fixed Position) | Persona **diundi sistem**, user tidak memilih |
| Label/nama persona AI di layar ("Sang Skeptis", dll.) | Persona **disimpan tapi TIDAK ditampilkan** — karakter AI hanya terasa dari tone pesannya |
| Skor/feedback per ronde | Skor **hanya di akhir sesi** (ronde 1–2 tanpa skor) |
| Leaderboard / ranking antar-user | Skor **personal** (refleksi diri) |
| Tombol ganti topik / reroll kategori | Kategori **diundi & terkunci** (anti-reroll) |
| Form login wajib di awal | Anonim langsung main; Google **opsional** (link akun) |
| Profil/avatar/badge selain streak | Out of scope |

**Prinsip tone:** Bahasa Indonesia, formal–tegas–menantang. Nuansa "arena tanding", bukan chatbot ramah. Mosi ditampilkan **sebelum** debat (teaser, bukan spoiler).

---

## 3. 🎮 Bahasa Desain: Se-Gamify Mungkin + DNA Wordle

Arahan utama: UI harus **terasa seperti game harian**, dengan kemiripan rasa ke **Wordle**. Penting — gamifikasi dicapai lewat **polish, animasi, ritual, dan reveal**, BUKAN dengan menambah XP/level/badge/leaderboard (sengaja absen sebagai keputusan prinsip — Design Decision §6). Yang boleh ditonjolkan: **streak, kejutan harian, verdict, breakdown skor, share, shared experience.**

### DNA Wordle yang diadopsi
| Elemen Wordle | Terjemahan di debat.in |
|---|---|
| Satu puzzle/hari, terkunci, **semua orang sama** | Satu mosi/kategori/hari, identik untuk semua user — tampilkan framing "Mosi hari ini — sama untuk semua penantang" |
| Minimalis, kontras tinggi, **satu kolom**, tipografi besar | Layout bersih satu kolom, banyak whitespace, hierarki tegas; tanpa clutter |
| **Tile + reveal warna** (hijau/kuning/abu) | 4 dimensi penilaian = **tile warna** (mis. 5 kotak per dimensi terisi sesuai skor 1–5); verdict = warna tegas 3 tingkat |
| **Animasi flip/reveal** memuaskan | Reveal kategori (flip), reveal verdict (staged), skor **count-up** 0→78, bubble AI muncul beranimasi |
| **Stats & streak modal** | Modal statistik ala Wordle: total main, streak, streak terbaik, **distribusi verdict** (bar 3 tingkat) |
| **Share = block art** disalin | Share card dengan **kotak warna emoji** + skor (lihat §4 #6) |
| **Tanpa login wall**, friksi rendah | Anonim langsung main |
| **"Come back tomorrow"** | Setelah selesai: countdown / "Mosi baru dalam HH:MM" + ajakan kembali besok |

### Juice / micro-interaction (wajib terasa)
- **Reveal kategori**: flip kartu + warna kategori menyembur.
- **Round progress**: pip/tile terisi tiap ronde (1▮2▯3▯ → penuh) — progres terasa seperti mengisi grid.
- **AI menyusun argumen**: indikator mengetik bernyawa (bukan spinner generik).
- **Verdict reveal**: animasi bertahap + warna + (opsional) confetti halus saat "Argumen Bertahan".
- **Skor count-up** + lingkaran terisi beranimasi; **tile dimensi** terisi satu per satu.
- **Streak flame** tumbuh/berdenyut saat bertambah; rayakan milestone (3/7/30 hari).
- Tombol & transisi **snappy/tactile**; (opsional) sound, default mute.
- **Hormati `prefers-reduced-motion`** — sediakan versi minim animasi.

### Sistem visual tile (jembatan ke Wordle)
- **5 warna kategori** konsisten dipakai di chip, reveal, share, history.
- **Skor dimensi 1–5 → 5 tile** terisi (gradasi warna intensitas). Inilah "bahasa kotak" debat.in.
- **Verdict 3 tingkat → 3 warna tegas**: Bertahan (hijau/emas) · Imbang (kuning) · Runtuh (merah/abu).

---

## 4. Inventaris Layar (yang harus didesain A1)

### 1. Boot / Splash
Auth anonim berjalan diam-diam. Logo + loading singkat. (Di prototype: langsung lewat.)

### 2. Onboarding + Consent — *hanya kunjungan pertama*
- Intro singkat "apa itu debat.in" (1–2 kalimat).
- **Consent ringan:** "Argumenmu dipakai untuk meningkatkan sistem." + CTA setuju.
- CTA "Mulai".

### 3. Today / Daily Reveal — *layar pembuka harian (momen Wordle)*
- Tanggal + streak badge (🔥 N hari).
- **Reveal kategori** yang diundi: "Kamu mendapat: **Ekonomi**" (animasi kejutan).
- **Kartu mosi:** `motion_text` + konteks netral (1–2 kalimat) + teaser sumber berita (judul + outlet).
- CTA besar: **"Mulai Debat"**.
- **State A — belum main:** reveal + start.
- **State B — sudah main hari ini:** "Kamu sudah bertanding hari ini" → tampilkan ringkasan hasil + tawarkan kategori lain.
- Tombol **lapor** pada mosi.

### 4. Arena (Debat) — *layar inti*
- Header: chip kategori + mosi (pinned, bisa collapse) + **indikator ronde (Ronde 1/3 → 3/3)**.
- Area transkrip gaya chat: **bubble AI** vs **bubble user** (dibedakan jelas).
- **Pembuka AI** (ronde 0) sudah tampil saat masuk.
- **Input argumen:** textarea + hitung karakter + tombol "Kirim Argumen"; validasi (min/maks, tidak kosong).
- **State "AI sedang menyusun argumen…"** (indikator mengetik/loading) — beat penting untuk rasa tanding.
- **Tanpa skor** di ronde 1–2.
- Ronde 3: setelah user kirim → AI penutup → transisi ke Hasil.
- Tombol **lapor** pada tiap respons AI.
- State error: "AI gagal merespons — coba lagi" (retry, sesi tidak hangus).

### 5. Result / Dashboard — *momen resolusi*
- **Verdict headline** (reveal dramatis, sebelum skor): "Argumen Bertahan" / "Imbang Ketat" / "Argumen Runtuh" (3 tingkat).
- **Skor total 0–100** (visual lingkaran).
- **4 kartu dimensi:** Penalaran · Relevansi · Responsiveness · Kejelasan — tiap kartu: skor + rationale 1 kalimat.
- **Feedback naratif** (2–3 kalimat, membangun).
- Update streak ("Streak-mu jadi 6 hari!").
- Aksi: **Bagikan** · **Lanjut kategori lain** (jika ada) · **Lihat Riwayat** · **Kembali**.

### 6. Share Card — *momen pamer (modal/overlay)* — **block art ala Wordle**
- Teks salin tetap sesuai TRD-06 (`debat.in — {tanggal}` · 📁 {kategori} · "{mosi}" · ⚔️ {skor}/100 · {verdict}).
- **Enhancement gamify:** tambahkan **baris kotak emoji** yang mengkodekan **skor total** sebagai bar terisi + warna verdict, contoh:
  ```
  debat.in — 11 Jun · 📁 Ekonomi
  ⚔️ 78/100 — Argumen Bertahan
  🟩🟩🟩🟩🟩🟩🟩🟩⬜⬜
  ```
  (8/10 kotak; warna mengikuti verdict). Sangat "Wordle", mudah disalin, dan **tidak membocorkan rincian per-dimensi** (anti-spoiler — Design Decision §6).
- **JANGAN** sertakan kotak per-4-dimensi di share (itu detail performa yang sengaja disembunyikan). Tile 4 dimensi hanya muncul di Result & History (privat).
- Tombol **Salin** → toast "Tersalin!". Tanpa persona/stance.

### 7. History — *refleksi diri*
- Daftar sesi: tanggal · kategori · mosi (dipotong) · skor total · mini 4 dimensi.
- **Grafik tren** 4 dimensi lintas waktu (line chart / Recharts).
- Empty state: "Belum ada riwayat — mulai debat pertamamu."

### 8. Next Category Transition — *bonus opsional*
- "Lanjut ke kategori lain?" → reveal kategori berikut + mosi → kembali ke Arena.
- Habis: "Kamu sudah menyelesaikan semua kategori hari ini! Kembali besok 👋".

### 9. Report Modal
- Target: mosi / respons AI; alasan opsional; "Laporkan" → "Laporan terkirim".

### 10. Account / Settings entry — *opsional (M4)*
- Status identitas (Anonim / Akun Google).
- Tombol **"Masuk dengan Google — simpan progres lintas-device"** (link akun).

### 11. Stats Modal — *ala Wordle (dari ikon statistik di top bar)*
- **Streak saat ini** + **streak terbaik** + **total main**.
- **Distribusi verdict** (bar 3 tingkat: Bertahan / Imbang / Runtuh) — paralel "guess distribution" Wordle.
- **Countdown "Mosi baru dalam HH:MM"** + ajakan kembali besok.
- Tombol **Bagikan** (share card #6).

### Cross-cutting (semua layar)
- **Top bar:** logo · streak · menu (Riwayat, Akun, Statistik).
- State global: Loading · Empty · Error · Toast.
- **Responsif** (mobile-first; web responsif — NFR-16/17).

---

## 5. Library Komponen (reusable)

`CategoryReveal` (flip beranimasi) · `MotionCard` · `CategoryChip` (warna per kategori) · `RoundProgress` (pip/tile terisi) · `ChatBubble` (AI/user, muncul beranimasi) · `ArgumentInput` (+counter+validasi) · `AIThinking` (mengetik bernyawa) · `ScoreCircle` (0–100, **count-up** + lingkaran terisi) · `DimensionTiles` (5 kotak terisi per dimensi) · `DimensionCard` · `VerdictReveal` (staged + warna 3 tingkat + confetti opsional) · `FeedbackPanel` · `ShareCard` (**block art**) · `StreakBadge` (flame berdenyut) · `StatsModal` (distribusi verdict) · `Countdown` ("mosi baru dalam…") · `TrendChart` · `SessionListItem` · `ReportButton`+`ReportModal` · `ConsentModal` · `GoogleLinkButton` · `EmptyState`/`ErrorState`/`LoadingState` · `PrimaryButton`/`SecondaryButton`/`Toast`/`TopBar`.

> Semua animasi menghormati `prefers-reduced-motion`. Sistem **tile warna** (skor 1–5 → 5 kotak) & **3 warna verdict** dipakai konsisten lintas Result, History, Stats, Share.

---

## 6. User Flow (sistem dari sisi user)

```
[Boot: auth anonim diam-diam]
   ↓
Kunjungan pertama? ──ya──▶ [Onboarding + Consent]
   ↓ tidak / setelah consent
[Today / Daily Reveal]
   ├─ sudah main hari ini ─▶ [Result hari ini] ─▶ (Lanjut kategori / Riwayat / Bagikan)
   └─ belum ─▶ reveal kategori + mosi ─▶ "Mulai Debat"
        ↓
   [Arena]  AI pembuka → user arg#1 → AI resp#1 → user arg#2 → AI resp#2 → user arg#3 → AI penutup
        ↓
   [Result Dashboard]  verdict → skor 0–100 → 4 dimensi + rationale → feedback → streak
        ├─ Bagikan ─▶ [Share Card]
        ├─ Lanjut kategori lain ─▶ [Next reveal] ─▶ [Arena]  (loop, berurutan, tanpa balik)
        └─ Lihat Riwayat ─▶ [History]

(Lapor) dapat dipicu dari Arena (mosi / respons AI).
(Akun Google) dapat diakses dari Top bar menu.
```

**Loop gamifikasi yang harus terasa:** datang → bertanding → resolusi → pamer → besok lagi.

---

## 7. Fitur/Beat yang Ditonjolkan (emosi yang didesain)

1. **The Reveal** — kejutan kategori harian (animasi, rasa "hari ini dapat apa").
2. **The Tension** — 3 ronde menanjak; karakter AI terasa dari tone (tanpa label persona); beat "AI sedang menyusun argumen".
3. **The Verdict** — klimaks, diumumkan sebelum angka.
4. **The Breakdown** — payoff analitis: skor 0–100 + 4 dimensi + rationale.
5. **The Share** — kartu pamer ala Wordle.
6. **The Streak** — ritual harian, reward kebiasaan.

---

## 8. Tahap A — Wireframe & Design System (deliverable A1, tanpa kode)

- Wireframe low-fi semua layar **× tiap state** (#2–#11).
- **Design system:** palet warna (termasuk 5 warna kategori), tipografi, spacing, tone "arena", ikon.
- Konsep visual gamify: **sistem tile warna** (skor 1–5 → 5 kotak), **3 warna verdict**, **VerdictReveal**, **ScoreCircle count-up**, **block-art share** — plus catatan animasi/micro-interaction per layar.
- **Naskah mock** (penting untuk Tahap B): 1–2 contoh mosi per kategori, dialog AI kalengan ronde 0–3, contoh hasil (skor + rationale + feedback + verdict) — semua Bahasa Indonesia.

## 9. Tahap B — Coded Prototype (Next.js + mock, simulasi penuh)

- **Stack:** Next.js (App Router) + TypeScript + TailwindCSS. Tanpa BE/Supabase/Gemini.
- **Mock layer:** `lib/mock/` berisi fixtures (motions, canned AI per ronde, result) + helper `fakeDelay()`.
- **State machine sesi di client:** `new → in_progress(round 0..3) → finished`; respons AI diambil dari fixture; delay disimulasikan (`setTimeout`).
- **Struktur file** (selaras struktur produk di Implementation Plan, agar reusable):
  ```
  src/app/page.tsx                  # Today / reveal
  src/app/arena/page.tsx            # Arena (state machine sesi mock)
  src/app/result/page.tsx           # Dashboard hasil
  src/app/history/page.tsx          # Riwayat + tren
  src/components/{arena,result,history,share,ui}/...
  src/lib/mock/{motions,debate,result}.ts
  ```
- Semua layar navigable; alur 3 ronde jalan end-to-end dengan data kalengan.
- Toggle/route khusus untuk melihat **state-state** (sudah-main, empty history, error AI) saat demo.

---

## 10. Deliverable untuk A1 (UI/UX)

1. Wireframe semua layar + state (Tahap A).
2. Design system + komponen visual (Tahap A).
3. Naskah mock Bahasa Indonesia (Tahap A).
4. Coded prototype clickable dengan simulasi 3 ronde (Tahap B).
5. Komponen di `src/components/**` siap dipakai ulang produk (input M1 Implementation Plan).

---

## 11. Verifikasi (demo prototype)

1. Buka di browser → onboarding+consent muncul sekali → Today reveal.
2. Klik "Mulai Debat" → Arena: pembuka AI tampil → kirim argumen → muncul "AI menyusun…" → respons AI → naik ronde, sampai ronde 3.
3. Ronde 3 selesai → Result: verdict → skor lingkaran → 4 kartu dimensi → feedback → streak.
4. "Bagikan" → Share Card → "Salin" → toast.
5. "Lihat Riwayat" → daftar sesi + grafik tren; cek empty state.
6. Cek state alternatif: sudah-main-hari-ini, error AI (retry), lanjut kategori lain.
7. Cek responsif di viewport mobile & desktop.
8. **Rasa gamify/Wordle:** reveal kategori (flip), round progress mengisi, verdict reveal bertahap, skor count-up, tile dimensi terisi, streak flame, share block-art, stats modal + countdown — semua terasa "juicy"; cek juga mode `prefers-reduced-motion`.
