# Dokumentasi FE — debat.in Prototype

Dokumen teknis lengkap untuk **prototype frontend debat.in**. Menjelaskan arsitektur,
setiap file, alur data, state, layer mock, sistem desain, pemetaan gamifikasi, dan
cara memperluas/menaikkannya menjadi produk asli.

- **Acuan produk:** `../docs/debat-in-FE-Prototype-Plan.md`, `../docs/debat-in-Implementation-Plan.md`, `../docs/TRD/*`
- **Sifat:** prototype **tanpa backend** — data dummy, alur debat **disimulasikan**.
- **Status build:** lulus `next build`; seluruh alur terverifikasi di browser.

---

## Daftar Isi
1. [Ringkasan & Tujuan](#1-ringkasan--tujuan)
2. [Tech Stack & Alasan](#2-tech-stack--alasan)
3. [Cara Menjalankan](#3-cara-menjalankan)
4. [Struktur Direktori](#4-struktur-direktori)
5. [Arsitektur & Alur Data](#5-arsitektur--alur-data)
6. [State & Persistensi (`store.ts`)](#6-state--persistensi-storets)
7. [Layer Mock & Logika Simulasi](#7-layer-mock--logika-simulasi)
8. [Lib: Tipe, Kategori, Util](#8-lib-tipe-kategori-util)
9. [Routing & Halaman](#9-routing--halaman)
10. [Katalog Komponen](#10-katalog-komponen)
11. [Sistem Desain](#11-sistem-desain)
12. [Pemetaan Gamifikasi & Wordle](#12-pemetaan-gamifikasi--wordle)
13. [Batasan Desain yang Ditegakkan di Kode](#13-batasan-desain-yang-ditegakkan-di-kode)
14. [Keterbatasan (Mock vs Produk Asli)](#14-keterbatasan-mock-vs-produk-asli)
15. [Pemetaan ke Produk Asli](#15-pemetaan-ke-produk-asli)
16. [Cara Memperluas](#16-cara-memperluas)
17. [Checklist Demo / Verifikasi](#17-checklist-demo--verifikasi)

---

## 1. Ringkasan & Tujuan

Prototype ini adalah **blueprint hidup** untuk anggota UI/UX & FE. Tujuannya:
- Menunjukkan **semua layar, state, dan komponen** yang harus didesain.
- Membuktikan **rasa "game harian"** ala Wordle dengan animasi & ritual.
- Menyediakan **komponen yang dapat dipakai ulang** saat produk asli dibangun (M1).

Yang **tidak** dilakukan prototype: memanggil Gemini, Supabase, atau RSS. Skor, respons
AI, dan riwayat semuanya **kalengan/simulasi** (lihat §7).

---

## 2. Tech Stack & Alasan

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | Sama dengan produk → komponen reusable; routing file-based |
| Bahasa | **TypeScript** | Kontrak tipe (`types.ts`) menjaga konsistensi data mock ↔ produk |
| Styling | **TailwindCSS 3** | Cepat, konsisten; token tema di `tailwind.config.ts` |
| Animasi | **framer-motion 11** | "Juice" gamify (reveal, count-up, spring) ringkas & declarative |
| Grafik | **recharts 2** | Grafik tren 4 dimensi di History |
| Persistensi | **localStorage** | Simulasi "uid persisten" + riwayat tanpa backend |

> **Catatan versi:** `next` dipatok ke `^14.2.35` (versi ter-patch). Node 18.18+ / 20+.

---

## 3. Cara Menjalankan

```bash
cd protoFE
npm install          # sekali
npm run dev          # http://localhost:3000
npm run build        # verifikasi produksi (type-check + prerender)
```

**Reset demo:** buka **Stats Modal** (ikon 📈 di top bar) → "Reset prototype".
Ini menghapus `localStorage` dan mengembalikan state awal (consent muncul lagi).

---

## 4. Struktur Direktori

```
protoFE/
├─ package.json            # deps & scripts
├─ next.config.mjs         # reactStrictMode
├─ tsconfig.json           # alias "@/*" → src/*
├─ tailwind.config.ts      # token tema (warna, font, shadow, keyframes)
├─ postcss.config.mjs
├─ README.md               # ringkas (cara jalan + peta layar)
├─ DOCUMENTATION.md        # dokumen ini
└─ src/
   ├─ app/                 # ROUTES (App Router)
   │  ├─ layout.tsx        # root layout (html/body, metadata, viewport)
   │  ├─ globals.css       # base Tailwind + .tile + reduced-motion
   │  ├─ page.tsx          # "/"        → Today / Daily Reveal
   │  ├─ arena/page.tsx    # "/arena"   → Arena debat 3 ronde (simulasi)
   │  ├─ result/page.tsx   # "/result"  → Dashboard hasil
   │  └─ history/page.tsx  # "/history" → Riwayat + tren
   ├─ components/          # KOMPONEN UI (reusable)
   │  ├─ ui/               #   primitives: Button, Modal, Toast, TopBar
   │  ├─ arena/            #   ChatBubble, AIThinking, ArgumentInput, RoundProgress
   │  ├─ result/           #   ScoreCircle, DimensionTiles, DimensionCard, VerdictReveal, FeedbackPanel
   │  ├─ history/          #   TrendChart, SessionListItem
   │  ├─ share/            #   ShareCard (block-art)
   │  └─ (root)            #   CategoryChip, CategoryReveal, MotionCard, StreakBadge,
   │                       #   Countdown, ConsentModal, ReportModal, StatsModal, GoogleLinkButton
   └─ lib/                 # LOGIKA & DATA
      ├─ types.ts          #   semua tipe data
      ├─ categories.ts     #   5 kategori + warna, 4 dimensi + bobot, verdict meta
      ├─ util.ts           #   agregasi skor, verdict, block-art, tanggal WIB, delay
      ├─ store.ts          #   useProto() — state global + localStorage
      └─ mock/
         ├─ motions.ts     #   5 mosi (1 per kategori)
         ├─ debate.ts      #   skrip AI kalengan per mosi
         └─ result.ts      #   baseline skor + heuristik effort → buildResult()
```

---

## 5. Arsitektur & Alur Data

Tidak ada server. Semua state di **client** (React) + dipersist ke **localStorage**.
Navigasi antar-halaman membawa konteks lewat **query string**, dan hasil dibaca kembali
dari store.

```
                         ┌──────────── localStorage (key: debatin_proto_v1) ───────────┐
                         │  ProtoState: consent, streak, sessions[], assignment, ...    │
                         └───────────────▲───────────────────────────▲──────────────────┘
                                         │ load()/persist()           │
                                  ┌──────┴───────┐                    │
                                  │  useProto()  │  (hook, src/lib/store.ts)
                                  └──────┬───────┘
        ┌──────────────────────────────┼───────────────────────────────┐
        │                               │                               │
   "/" Today                      "/arena"                         "/result", "/history"
   - assignCategory()            - render mosi+skrip (mock)         - baca sessions by sid
   - reveal / "sudah main"       - simulasi 3 ronde (fakeDelay)     - tampilkan skor/tren
   - push /arena?cat=&bonus=     - buildResult() → finishSession()
                                  - push /result?sid=&fresh=1
```

**Alur lengkap satu sesi:**
1. **Today** memanggil `assignCategory()` → mengunci 1 kategori aktif (anti-reroll), tampilkan `CategoryReveal` + `MotionCard`.
2. Klik "Mulai Debat" → `router.push('/arena?cat=<id>&bonus=0')`.
3. **Arena** ambil `MOTION_BY_CATEGORY[cat]` + `getScript(motion_id)`; jalankan state machine `thinking → await → (ulang) → done` untuk 3 ronde.
4. Pada ronde 3: `buildResult()` menghitung skor (heuristik effort), `finishSession()` menyimpan + update streak/distribusi, lalu `router.push('/result?sid=<id>&fresh=1')`.
5. **Result** membaca `sessions.find(sid)` → `VerdictReveal`, `ScoreCircle`, `DimensionCard×4`, `FeedbackPanel`, `ShareCard`.
6. **History** membaca seluruh `sessions` → `TrendChart` + daftar.

---

## 6. State & Persistensi (`store.ts`)

Seluruh state dikelola hook **`useProto()`**. Sumber: [src/lib/store.ts](src/lib/store.ts).

### Bentuk `ProtoState` (lihat `types.ts`)
| Field | Tipe | Arti |
|---|---|---|
| `consented` | `boolean` | sudah setuju consent (gate onboarding) |
| `streak` / `bestStreak` / `totalPlayed` | `number` | statistik gamifikasi |
| `lastPlayedDate` | `string \| null` | tanggal terakhir main (untuk logika streak) |
| `verdictDist` | `{bertahan,imbang,runtuh: number}` | distribusi vonis (Stats Modal) |
| `todayDate` | `string` | penanda hari aktif (untuk roll-over) |
| `activeCategories` | `CategoryId[]` | 4 kategori aktif hari ini (rotasi simulasi) |
| `assignedCategory` | `CategoryId \| null` | kategori pertama yang **dikunci** |
| `playedTodayCategories` | `CategoryId[]` | kategori yang sudah dituntaskan hari ini |
| `sessions` | `SessionResult[]` | riwayat (terbaru di depan) |
| `isAnonymous` | `boolean` | status identitas (untuk Google link) |

### Inisialisasi & seed
- Key localStorage: **`debatin_proto_v1`**.
- `defaultState()` **men-seed** 4 sesi lampau (5/6/8/10 Jun) + `streak=3`, `bestStreak=5`
  agar History & tren **tidak kosong** saat demo pertama.
- `consented` default **false** → `ConsentModal` muncul sekali.

### Roll-over harian
`load()` membandingkan `todayDate` dengan `todayWIB()`. Jika beda → field harian
(`activeCategories`, `assignedCategory`, `playedTodayCategories`) **direset**, tetapi
`sessions`/`streak` dipertahankan. Ini meniru "mosi baru tiap hari".

### Aksi yang diekspos
| Aksi | Efek |
|---|---|
| `consent()` | set `consented=true` |
| `assignCategory()` | jika belum ada, undi 1 kategori aktif yang belum dimainkan → kunci. **Idempoten** (anti-reroll). Mengembalikan kategori terpilih |
| `nextCategory(state)` | kembalikan kategori aktif lain yang belum dimainkan (bonus), atau `null` |
| `finishSession(result)` | push ke `sessions`, tandai kategori played, update `totalPlayed`/`verdictDist`, dan **streak** (hanya untuk sesi pertama hari itu) |
| `linkGoogle()` | set `isAnonymous=false` (simulasi link akun) |
| `reset()` | hapus localStorage + kembali ke `defaultState()` |

### Logika streak (di `finishSession`)
```
firstToday = lastPlayedDate !== today
if firstToday:
   if lastPlayedDate === kemarin → streak += 1
   else                          → streak = 1
   lastPlayedDate = today
   bestStreak = max(bestStreak, streak)
sesi bonus (bukan pertama hari itu) → streak TIDAK berubah
```

> **Pola React penting:** `useProto` mengembalikan `state: null` sampai `useEffect`
> pertama jalan (mencegah mismatch SSR/CSR). Semua halaman menampilkan state "Memuat…"
> selama `ready === false`.

---

## 7. Layer Mock & Logika Simulasi

### 7.1 Mosi — [src/lib/mock/motions.ts](src/lib/mock/motions.ts)
5 objek `Motion` (satu per kategori): `motion_text`, `context` netral, `claim_form`
(kebijakan/fakta/nilai), dan provenance (`source_title`, `source_outlet`).
`MOTION_BY_CATEGORY` memetakan kategori → mosi; `getMotion(id)` lookup by id.

### 7.2 Skrip debat — [src/lib/mock/debate.ts](src/lib/mock/debate.ts)
`DEBATE_SCRIPTS[motion_id]` = `{ opening, rebuttals[2], closing }` — teks AI kalengan
dengan tone **formal–tegas–menantang**. `getScript()` punya fallback generik.
**Penting:** respons AI **tidak** benar-benar membaca argumen user (ini simulasi) —
teks ditulis cukup umum agar tetap terasa seperti sanggahan.

### 7.3 Penilaian — [src/lib/mock/result.ts](src/lib/mock/result.ts)
Karena tak ada LLM, skor dihitung **heuristik ringan** supaya prototype terasa "alive":

```
effortDelta(userArgs):
   words = total kata 3 argumen
   words >= 90 → +1 ; words >= 40 → 0 ; else → -1

buildResult():
   base   = BASELINE[motion_id]        (kalengan, koheren dengan rationale)
   scores = base + delta (penalaran/responsiveness),
            kejelasan +1 jika delta>0,
            relevansi DIPERTAHANKAN (agar gate relevansi konsisten)
   total  = aggregate(scores)          (lihat util.ts)
   verdict= computeVerdict(scores)
   feedback = FEEDBACK[verdict]
```

Artinya: **argumen lebih panjang/substansial → skor & verdict lebih baik.** Rationale
per dimensi bersifat deskriptif-netral agar tetap masuk akal di rentang skor mana pun.

---

## 8. Lib: Tipe, Kategori, Util

### 8.1 `types.ts` — [src/lib/types.ts](src/lib/types.ts)
Sumber kebenaran tipe: `CategoryId` (5), `ClaimForm` (3), `DimensionId` (4),
`VerdictTier` (3), `Motion`, `Turn` (`{role, content, round}`), `DebateScript`,
`Scores` (`Record<DimensionId, number>` 1–5), `SessionResult`, `ProtoState`.

### 8.2 `categories.ts` — [src/lib/categories.ts](src/lib/categories.ts)
- `CATEGORIES`: `{id,label,emoji,color,soft}` untuk 5 kategori. **Warna disimpan sebagai
  hex** dan dipakai **inline style** (bukan kelas Tailwind dinamis) agar aman dari purge.
- `DIMENSIONS`: `[{id,label,weight}]` → Penalaran **0.35**, Relevansi **0.25**,
  Responsiveness **0.25**, Kejelasan **0.15**.
- `VERDICT_META`: label, warna, blurb, emoji untuk 3 tingkat verdict.

### 8.3 `util.ts` — [src/lib/util.ts](src/lib/util.ts)
| Fungsi | Keterangan |
|---|---|
| `fakeDelay(ms)` | Promise timeout — simulasi "AI menyusun argumen" |
| `uid()` | id acak ringkas |
| `todayWIB()` | tanggal hari ini di WIB (UTC+7) → `yyyy-mm-dd` |
| `formatTanggalID(iso)` | → `"11 Jun 2026"` |
| `aggregate(scores)` | `raw = Σ bobot·skor` (1–5) → `round((raw-1)/4·100)`; **gate**: jika `relevansi ≤ 2` → `×0.5`; clamp 0–100 |
| `computeVerdict(scores)` | `base = 0.5·responsiveness + 0.5·penalaran`; ≥4 **bertahan**, ≥2.5 **imbang**, else **runtuh** |
| `scoreToBlocks(total,tier)` | block-art Wordle: `round(total/10)` kotak warna verdict + sisanya ⬜ |
| `pickRandom`, `shuffle`, `clamp` | utilitas umum |

> Rumus `aggregate`, gate relevansi, dan `computeVerdict` **identik** dengan TRD-05 →
> sengaja dibuat portabel ke produk asli.

---

## 9. Routing & Halaman

Semua halaman adalah **Client Component** (`"use client"`) karena pakai `useProto`
(localStorage) & animasi.

### 9.1 `/` — Today / Daily Reveal — [src/app/page.tsx](src/app/page.tsx)
- **Effect:** setelah `consented`, panggil `assignCategory()` sekali (guard `!assignedCategory`).
- **Dua state utama:**
  - *Belum main* → `CategoryReveal` + `MotionCard` + tombol "Mulai Debat".
  - *Sudah main* (`playedTodayCategories.includes(assigned)`) → ringkasan hasil + "Lanjut kategori lain"/"Lihat Riwayat".
- Baris **status kategori aktif** (chip ✓/•) di atas.
- Modal: `ConsentModal` (gate), `StatsModal`, `ReportModal` (target mosi).
- Footer: `GoogleLinkButton`.

### 9.2 `/arena` — Arena Debat — [src/app/arena/page.tsx](src/app/arena/page.tsx)
- Dibungkus `<Suspense>` (karena `useSearchParams`).
- Query: `cat` (kategori), `bonus` (`"1"`=sesi bonus).
- **State machine fase:** `thinking | await | done`; `round` 1→3.
  - Mount → `fakeDelay(1100)` → tampilkan **opening** (sekali, guard `started.current`).
  - `handleSubmit(text)` → push bubble user → `thinking` → `fakeDelay(1300)`:
    - ronde 1–2 → push `rebuttals[round-1]`, `round++`, `await` (**tanpa skor**).
    - ronde 3 → push `closing` → `buildResult()` → `finishSession()` → tombol "Lihat Penilaian →".
- `userArgs` disimpan di `useRef` (untuk heuristik effort). Auto-scroll ke bawah tiap giliran.
- `ReportModal` target `ai_response`.

### 9.3 `/result` — Dashboard Hasil — [src/app/result/page.tsx](src/app/result/page.tsx)
- `<Suspense>`; query `sid` (+`fresh=1` → banner "Streak-mu jadi N").
- Urutan reveal: `VerdictReveal` (klimaks) → `ScoreCircle` (count-up) → `DimensionCard×4`
  (tile beranimasi) → `FeedbackPanel`.
- Aksi: **Bagikan** (`Modal`+`ShareCard`), **Lanjut kategori** (jika ada), **Kembali**.

### 9.4 `/history` — Riwayat & Tren — [src/app/history/page.tsx](src/app/history/page.tsx)
- `TrendChart` (tampil jika ≥2 sesi) + daftar `SessionListItem`.
- Empty state bila belum ada sesi. `StatsModal` dari top bar.

---

## 10. Katalog Komponen

### 10.1 Primitives — `components/ui/`
| Komponen | Props inti | Peran |
|---|---|---|
| `Button` | `variant` (primary/secondary/ghost/danger), `full`, `disabled` | tombol; `whileTap` scale |
| `Modal` | `open`, `onClose`, `title` | overlay + spring; `AnimatePresence` |
| `Toast` | `message` | pil notifikasi bawah (mis. "Tersalin!") |
| `TopBar` | `streak`, `onOpenStats` | header: logo, `StreakBadge`, link Riwayat, Stats |

### 10.2 Arena — `components/arena/`
| Komponen | Peran |
|---|---|
| `RoundProgress` | pip terisi "Ronde N/3" (rasa mengisi grid) |
| `ChatBubble` | bubble AI vs user; AI punya tombol lapor (muncul saat hover) |
| `AIThinking` | indikator mengetik bernyawa (3 titik) |
| `ArgumentInput` | textarea + counter + validasi (min 20 / maks 600) + ⌘/Ctrl+Enter |

### 10.3 Result — `components/result/`
| Komponen | Peran |
|---|---|
| `VerdictReveal` | reveal verdict bertahap; **confetti** saat "bertahan" |
| `ScoreCircle` | ring SVG + **count-up** angka 0→skor |
| `DimensionTiles` | skor 1–5 → 5 kotak terisi beranimasi (bahasa Wordle) |
| `DimensionCard` | nama dimensi + bobot + skor + `DimensionTiles` + rationale |
| `FeedbackPanel` | "Catatan Juri" naratif |

### 10.4 History / Share / Root
| Komponen | Peran |
|---|---|
| `history/TrendChart` | line chart 4 dimensi (recharts), domain 1–5, legend |
| `history/SessionListItem` | entri riwayat: tanggal, kategori, mosi, skor, mini 4 dimensi |
| `share/ShareCard` | teks salin (TRD-06) + **block-art**; `navigator.clipboard` |
| `CategoryChip` | label kategori berwarna |
| `CategoryReveal` | flip reveal kategori harian |
| `MotionCard` | kartu mosi + konteks + sumber + tombol lapor |
| `StreakBadge` | 🔥 + angka; opsi animasi flame |
| `Countdown` | "Mosi baru dalam HH:MM:SS" (ke tengah malam WIB) |
| `ConsentModal` | onboarding + consent (sekali) |
| `ReportModal` | lapor mosi / respons AI + alasan opsional |
| `StatsModal` | statistik + **distribusi vonis** + countdown + reset |
| `GoogleLinkButton` | CTA link Google / status tertaut |

---

## 11. Sistem Desain

### Token tema — [tailwind.config.ts](tailwind.config.ts)
- **Warna:** `ink` (#0f172a teks), `paper` (#fbfbf9 bg), `brand` (#4f46e5 + `brand.soft`).
- **Font:** stack sistem (tanpa fetch jaringan → prototype tahan offline).
- **Shadow:** `card`, `pop`.
- **Keyframes/anim:** `fade-up`, `flame` (streak), `shimmer`.

### `globals.css` — [src/app/globals.css](src/app/globals.css)
- Background body: radial-gradient lembut + paper.
- **`.tile` / `.tile--on`**: kotak skor; warna isi dari custom property `--tile` (di-set inline per kategori).
- **`prefers-reduced-motion`**: override global → durasi animasi ~0 (aksesibilitas).
- Scrollbar tipis untuk transkrip.

### Bahasa visual
- **5 warna kategori** konsisten (chip, reveal, tile, share).
- **Skor 1–5 → 5 tile** terisi; **verdict → 3 warna** (hijau/kuning/merah).
- Animasi via framer-motion: spring untuk masuk, `animate` count-up, staggered tile.

---

## 12. Pemetaan Gamifikasi & Wordle

| Elemen Wordle | Implementasi di kode |
|---|---|
| Satu puzzle/hari, terkunci, shared | `assignCategory()` mengunci kategori; teks "Sama untuk semua penantang hari ini" di `CategoryReveal` |
| Tile + reveal warna | `DimensionTiles` (skor→kotak), `.tile` di globals.css |
| Animasi flip/reveal | `CategoryReveal` (rotateX), `VerdictReveal` (spring+confetti), `ScoreCircle` (count-up) |
| Stats & streak modal | `StatsModal` (total/streak/best + distribusi vonis), `StreakBadge` |
| Share = block art | `scoreToBlocks()` + `ShareCard` (🟩/🟨/🟥 × skor) |
| Tanpa login wall | identitas anonim implisit; `GoogleLinkButton` opsional |
| "Come back tomorrow" | `Countdown` ke tengah malam WIB |

**Beat emosi** (datang→bertanding→resolusi→pamer→besok): reveal harian → arena 3 ronde
dengan "AI menyusun argumen" → verdict+skor → share → countdown.

---

## 13. Batasan Desain yang Ditegakkan di Kode

Aturan dari FE Prototype Plan §2 **diterapkan**, bukan sekadar dicatat:
- **Tidak ada pemilihan mode / persona oleh user** — persona menempel ke mosi & tak punya UI pemilih.
- **Persona tidak dilabeli** — `debate.ts` hanya teks bertone; tak ada nama gaya di layar.
- **Tidak ada skor di ronde 1–2** — Arena hanya menambah bubble; skor dibuat di ronde 3.
- **Tidak ada leaderboard** — hanya skor personal + streak.
- **Anti-reroll** — `assignCategory()` idempoten; refresh tak mengganti kategori.
- **Share tanpa rincian dimensi** — `ShareCard` hanya total + verdict (block-art).

---

## 14. Keterbatasan (Mock vs Produk Asli)

| Aspek | Prototype | Produk asli (TRD) |
|---|---|---|
| Respons AI | teks kalengan, **tak membaca argumen** | LLM (Gemini) per ronde, adaptif |
| Skor | heuristik panjang argumen | evaluator LLM 4 dimensi (TRD-05) |
| Mosi | 5 statis | pipeline RSS + generate harian (TRD-02) |
| Identitas/persistensi | localStorage | Supabase auth + DB (TRD-01/06) |
| Keamanan konten | tombol lapor (UI saja) | 3 gerbang + auto-retire (TRD-03) |
| Resume sesi tengah jalan | tidak (refresh = hilang) | state sesi tersimpan |
| Google OAuth | toggle simulasi | `linkIdentity` Supabase |

---

## 15. Pemetaan ke Produk Asli

Saat M1 dibangun, ganti **layer**, pertahankan **komponen & tipe**:

| Prototype | Diganti dengan |
|---|---|
| `lib/store.ts` (localStorage) | klien Supabase + endpoint `/api/session/*` (TRD-07) |
| `lib/mock/debate.ts` | panggilan persona LLM (TRD-04) |
| `lib/mock/result.ts` `buildResult()` | evaluator LLM/IndoBERT (TRD-05/08) |
| `lib/mock/motions.ts` | query `daily_motion` dari DB (TRD-01/02) |
| `assignCategory()` | `GET /api/session/today` (assignment server-side) |
| `util.ts` (`aggregate`, `computeVerdict`, `scoreToBlocks`) | **dipakai apa adanya** |
| Semua `components/**` | **dipakai apa adanya** (props sudah selaras kontrak API) |

> Karena `types.ts` mencerminkan skema produk dan `util.ts` memakai rumus TRD, migrasi
> sebagian besar = mengganti sumber data, bukan menulis ulang UI.

---

## 16. Cara Memperluas

**Tambah mosi baru:** tambahkan objek di `motions.ts` + skrip di `debate.ts` (key =
`motion_id`) + opsional baseline di `result.ts`.

**Tambah/ubah kategori:** edit `CategoryId` di `types.ts` + entri `CATEGORIES` +
`CATEGORY_ORDER`. Warna otomatis terpakai di chip/tile/share.

**Tuning skor/verdict:** ubah `BASELINE`/`effortDelta` (mock) atau rumus di `util.ts`.

**Tambah layar:** buat `src/app/<route>/page.tsx`; pakai `useProto()` untuk state;
reuse komponen. Jika pakai `useSearchParams`, bungkus dengan `<Suspense>`.

**Mode demo state:** untuk menampilkan state tertentu, gunakan tombol Reset (Stats)
lalu mainkan, atau (pengembangan lanjut) tambahkan query param pembaca state.

---

## 17. Checklist Demo / Verifikasi

1. **/** → Consent (sekali) → reveal kategori + mosi.
2. "Mulai Debat" → Arena: opening AI → kirim argumen → "AI menyusun…" → tanggapan → ronde 2 → ronde 3 (tanpa skor di 1–2).
3. Ronde 3 → "Lihat Penilaian" → Result: verdict → skor count-up → 4 tile dimensi → Catatan Juri → streak naik.
4. "Bagikan" → block-art + "Salin" → toast "Tersalin!".
5. "Lanjut kategori" → arena lagi (sesi bonus; streak tak bertambah).
6. **/history** → grafik tren 4 garis + daftar sesi.
7. Stats (📈) → distribusi vonis + countdown; "Reset prototype" mengembalikan ke awal.
8. Aksesibilitas: aktifkan **reduce motion** OS → animasi minim, alur tetap jalan.

---

*Dokumen ini mendeskripsikan kode aktual di `protoFE/src/`. Jika kode berubah,
perbarui bagian terkait agar tetap menjadi sumber kebenaran FE prototype.*
