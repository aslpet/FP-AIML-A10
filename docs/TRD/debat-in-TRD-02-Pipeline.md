# TRD-02 — Pipeline Berita & Generasi Mosi · debat.in

| | |
|---|---|
| **Komponen** | Pipeline harian (ingest → mosi live + antrian) |
| **Versi** | 1.0 · Draft |
| **Acuan** | TRD-00 §6; TRD-01; TRD-03 (keamanan); SRS FR-9…FR-18 |

> Bidang **harian/batch** (flat cost). Dipicu scheduler, bukan kunjungan user. Gerbang keamanan (Gerbang 1 & 2) detailnya di **TRD-03**; di sini hanya titik pemanggilannya.

---

## 1. Entry Point

```
GET /api/cron/daily      (Authorization: Bearer CRON_SECRET)
```
Idempoten per `(tanggal, kategori)`. Menjalankan seluruh pipeline untuk hari berjalan (WIB).

---

## 2. Alur Utama (per hari)

```
1. Tentukan kategori aktif hari ini  → rotasi 4 dari 5 (§3)
2. Untuk tiap kategori aktif:
   a. ingest RSS (artikel ≤48 jam)
   b. [GERBANG 1] filter berita (TRD-03)         → buang non-debatable / hukum bernama
   c. pilih 1 berita paling debatable
   d. generate ≤3 kandidat mosi + skor kelayakan + [GERBANG 2] (TRD-03)
      └─ satu panggilan LLM (MODEL_PIPELINE)
   e. promote: kandidat lolos tertinggi → status=live, live_date=hari ini
      tie-break: claim_form ≠ mosi live kemarin di kategori ini
      sisanya yang lolos → status=queued
   f. JIKA tidak ada kandidat lolos:
      → ambil dari ANTRIAN (queued, kategori sama, termuda, belum kadaluarsa)
      → JIKA antrian kosong → mosi FALLBACK statis
3. Housekeeping: retire kandidat antrian kadaluarsa (created_at < now()-3d)
```

---

## 3. Rotasi Kategori (4 dari 5)

```
INPUT: 5 kategori, riwayat tayang N hari terakhir
- Hitung "hari sejak terakhir aktif" per kategori.
- WAJIB sertakan kategori yang sudah absen 2 hari (pagar keadilan, FR-3).
- Sisanya diisi acak hingga DAILY_ACTIVE_CATEGORIES (=4).
OUTPUT: 4 kategori aktif hari ini.
```
Catatan: bila ≥2 kategori menyentuh batas absen-2-hari sekaligus, prioritaskan keduanya lebih dulu, lalu acak sisa slot.

---

## 4. Ingest RSS

- `RSS_FEEDS_JSON` memetakan `category → [feed_url,…]`.
- Ambil item terbit **≤48 jam**; ekstrak `title`, `link`, `published`, `summary`.
- `source_id = hash(canonical_url)` — penanda grouping (anti-redundansi lintas mosi).
- Library: parser RSS standar (mis. `rss-parser` untuk Node). Timeout & error per-feed → lanjut feed lain (jangan gagalkan seluruh kategori).

---

## 5. Generate + Rank + Safety (satu panggilan LLM)

**Model:** `MODEL_PIPELINE` (Flash). **Output:** JSON ketat.

**Skeleton prompt (ringkas):**
```
SISTEM: Kamu kurator mosi debat berbahasa Indonesia untuk aplikasi pelatihan argumentasi.
Dari artikel berikut, lakukan:
1. Tentukan apakah artikel DEBATABLE (punya dua sisi). Jika tidak → {"reject":"non_debatable"}.
2. Jika menyangkut perkara hukum dengan NAMA individu belum divonis → {"reject":"named_legal"}.
3. Hasilkan SAMPAI 3 kandidat mosi lintas bentuk (kebijakan/fakta/nilai).
   Tiap mosi: proposisi + konteks netral 1–2 kalimat.
4. Untuk TIAP kandidat, jalankan TES MARTABAT:
   - objek kebijakan/ide → lolos; objek kelayakan/keberadaan kelompok → coba REFRAME ke kebijakan.
   - jika reframe gagal → tandai reject.
   - jika menjadikan penderitaan korban sebagai objek → reject (kapan pun).
   - flag "beban" jika menyentuh kondisi personal kelompok rentan (TIDAK reject).
5. Beri skor kelayakan 0–100 (keseimbangan dua sisi, aksesibilitas, kejelasan, daya cengkeram).
ARTIKEL: {title, summary, date}
KEMBALIKAN HANYA JSON:
{"candidates":[{"motion_text","context","claim_form","quality_score","flags":{"beban":bool,"reframed":bool},"reject":null|"reason"}]}
```

> Detail aturan tes martabat, reframe, dan pengkritik ada di **TRD-03**; prompt di atas adalah titik pemanggilannya. Pengkritik dapat berupa lapisan kedua (panggilan terpisah) bila tim ingin pemisahan tegas — lihat TRD-03 §4.

**Pasca-LLM (kode):**
- Parse JSON (toleran + fallback). Buang kandidat `reject != null`.
- Persist kandidat lolos sebagai `daily_motion` (`status='candidate'` dulu).
- **Promote**: pilih `quality_score` tertinggi; terapkan tie-break `claim_form`; set `live`, `live_date`, lampirkan **persona** (undi, TRD-04 §2) + `ai_position`. Sisanya `queued`.

---

## 6. Antrian (cadangan) & TTL

- **Dipakai hanya** bila langkah generate gagal menghasilkan kandidat lolos (RSS mati / semua reject / tak debatable).
- **Pengambilan LIFO**: `status='queued' AND category=? AND created_at >= now()-INTERVAL '3 days'` → urut `created_at DESC` → ambil 1 → promote `live`.
- **TTL/housekeeping** (tiap run): `UPDATE daily_motion SET status='retired' WHERE status='queued' AND created_at < now()-INTERVAL '3 days'`.

---

## 7. Fallback Statis

- Set mosi timeless cadangan (per kategori, disiapkan tim; objeknya kebijakan/nilai, bebas isu sensitif).
- Dipakai hanya bila berita segar **dan** antrian sama-sama kosong.
- Ditandai (`source_outlet='static_fallback'`) untuk metrik "rasio fallback".

---

## 8. State Machine Mosi

```
candidate ──promote──▶ live ──(besok / report≥3 / digantikan)──▶ retired
    │                                   ▲
    └──(tidak terpilih, lolos)──▶ queued┘ (promote saat paceklik)
        └──(TTL 3 hari)──▶ retired
```

---

## 9. Idempotensi & Error

- Sebelum generate kategori, cek apakah `daily_motion` `live` untuk `(category, today)` sudah ada → jika ya, **skip** (idempoten; aman bila cron terpanggil dua kali).
- Error per kategori diisolasi (try/catch per kategori) — satu kategori gagal tidak menggagalkan lainnya.
- Log per tahap: kategori, jumlah artikel, jumlah kandidat, jumlah lolos, sumber mosi final (fresh/queue/fallback), durasi.

---

## 10. Output Komponen

Setelah run sukses: setiap kategori aktif memiliki **tepat satu** `daily_motion status='live', live_date=today`, lengkap dengan persona — siap dikonsumsi Mesin Sesi (TRD-04).
