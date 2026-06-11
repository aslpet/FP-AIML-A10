# TRD-04 — Mesin Sesi & Persona · debat.in

| | |
|---|---|
| **Komponen** | Mesin sesi debat + persona engine |
| **Versi** | 1.0 · Draft |
| **Acuan** | TRD-00 §5; TRD-01 (`session`,`assignment`); TRD-03 §5 (pengaman AI); TRD-05 (evaluasi); SRS FR-28…FR-35 |

> Bidang **per-request** (scale dengan user). Mengorkestrasi assignment → persona → debat 3 ronde. Penilaian akhir didelegasikan ke TRD-05.

---

## 1. Assignment Kategori (server-side, terkunci)

Saat user membuka app (atau memanggil `/api/session/today`):
```
1. Ambil uid dari token auth (anonim/akun). Upsert app_user.
2. Cek assignment(uid, today):
   - ADA → pakai kategori tercatat.
   - TIDAK → undi acak dari KATEGORI AKTIF hari ini yang BELUM dimainkan uid;
            INSERT assignment(uid, today, kategori).  ← terkunci, anti-reroll
3. Cek session(uid, today, kategori):
   - finished → kembalikan hasil (dashboard).
   - berjalan → kembalikan state ronde berjalan.
   - belum ada → siap mulai sesi baru.
```
**Lanjut kategori (bonus):** endpoint terpisah mengundi kategori aktif **lain** yang belum dimainkan uid hari itu (tanpa menyentuh `assignment` pertama). Tidak bisa mengulang kategori `finished` (uq_session).

> Undian **wajib di server**; client tidak menghitung kategori (cegah reroll via refresh).

---

## 2. Persona Engine

Persona **menempel ke mosi** (di-set saat promote, TRD-02 §5) — semua user pada mosi sama menghadapi persona sama.

- `persona_stance` ∈ {kontrarian, berpendirian}
- `persona_style` ∈ {penuntut, skeptis, pragmatis, idealis, analis_data}
- `ai_position` (teks) — hanya untuk **berpendirian**; ditentukan saat promote dengan **pengaman beban** (TRD-03 §5.2).

**Undian persona (saat promote):** acak `stance × style`. Jika `flags.beban=true` dan stance=berpendirian → `ai_position` dipilih agar tidak menyerang kondisi personal terkait.

**Tabel gaya → instruksi serangan (system prompt):**

| Style | Inti serangan |
|---|---|
| penuntut | serang klaim terkuat user lebih dulu; tuntut pertahankan |
| skeptis | bongkar lewat pertanyaan ("apa buktimu?", "premis mana yang menjamin?") |
| pragmatis | gugat kelayakan dunia nyata (biaya, penegakan, implementasi) |
| idealis | gugat dari nilai/etika ("sekalipun efektif, apakah adil?") |
| analis_data | gugat **struktur penalaran** & generalisasi; **TIDAK** memvalidasi kebenaran fakta |

---

## 3. System Prompt Persona (skeleton)

```
PERAN: Kamu lawan debat dalam debat.in. Gaya: {style_desc}. 
POSISI: {kontrarian: "ambil sisi berlawanan dari argumen terakhir user";
         berpendirian: "pertahankan posisi: {ai_position}"}.
MOSI: {motion_text}
KONTEKS: {context}

ATURAN (WAJIB):
- Serang ARGUMEN/logika/bukti, JANGAN pernah pribadi atau kelompok.
- Bela posisi lewat kebijakan/konsekuensi/nilai, bukan merendahkan siapa pun.
- {jika beban: "Jangan menyerang kondisi personal kelompok terkait; argumen dari sisi sistemik."}
- Gaya retorikamu TETAP sepanjang sesi. Isi & intensitas serangan MENGIKUTI argumen user:
  argumen lemah → serangan yang membuka jalan; argumen kuat → serangan penuh.
- Bahasa Indonesia, formal–tegas–menantang. Ringkas (maks ~150 kata/giliran).

RIWAYAT: {ringkasan giliran sebelumnya}
ARGUMEN USER TERAKHIR: {user_text}   // kosong jika pembuka

KEMBALIKAN JSON: {"ai_message": "..."}
```

- **Pembuka (ronde 0):** `user_text` kosong → AI membuka menyatakan posisi & menantang.
- **Ronde 1–2:** tanggapan/serangan, **tanpa skor**.
- **Ronde 3:** lihat §4.

---

## 4. Alur Sesi (3 Ronde)

```
START  → AI opening (persona)                        [LLM: MODEL_PERSONA]
R1     user_arg#1 → AI tanggapan#1 (tanpa skor)      [LLM: MODEL_PERSONA]
R2     user_arg#2 → AI tanggapan#2 (tanpa skor)      [LLM: MODEL_PERSONA]
R3     user_arg#3 → AI penutup + panggil EVALUATOR   [LLM: persona penutup + TRD-05]
FINISH simpan skor 4 dimensi + feedback + total + verdict(opsional); finished=true
```

- `session.transcript` di-append tiap giliran `{role, content, round}`.
- `current_round` increment; **maks 3** (bounded).
- **Penutup ronde 3** = tanggapan persona terakhir (apresiatif, tanpa tantangan baru) **lalu** panggilan evaluator (TRD-05). Bisa 1 panggilan persona + 1 evaluator, atau evaluator saja jika penutup digabung — implementasi tim; default: pisah agar evaluator netral.

---

## 5. Orkestrasi LLM & Token (lihat TRD-00 §5)

- **Per ronde** kirim **ringkasan** giliran sebelumnya (bukan transkrip verbatim) → hemat token.
- **Evaluator** (TRD-05) menerima **teks utuh** ketiga argumen user + konteks sanggahan (butuh untuk Responsiveness).
- Semua panggilan: JSON ketat + pembersih fence + fallback; retry-with-backoff.
- Estimasi sesi: 1 pembuka + 3 tanggapan + 1 evaluasi ≈ 5 panggilan; evaluasi sekali-di-akhir (bukan per ronde) = hemat vs alternatif.

---

## 6. Penanganan Error Sesi

- LLM gagal/timeout di tengah ronde → tampilkan pesan retry; jangan tandai `finished`. State sesi tersimpan, user bisa lanjut.
- Evaluator gagal → fallback skor default + tandai untuk dilihat tim; sesi tetap bisa ditutup agar user tidak terjebak.
- Validasi input user (panjang min/maks, non-kosong) sebelum panggil LLM.

---

## 7. Output Komponen
Sesi `finished=true` dengan 4 skor + rationale + total + feedback (+verdict) tersimpan di `session` — dikonsumsi Dashboard & History (TRD-06).
