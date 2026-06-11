# TRD-05 — Evaluasi & Penilaian · debat.in

| | |
|---|---|
| **Komponen** | Evaluator argumen (penilaian 4 dimensi) |
| **Versi** | 1.0 · Draft |
| **Acuan** | TRD-04 (dipanggil di ronde 3); TRD-01 (`session`); TRD-08 (IndoBERT opsional); SRS FR-36…FR-41 |

> **Terpisah & netral dari persona** (TRD-04). Evaluator menilai argumen user vs mosi — **tidak tahu/tidak peduli** posisi yang dibela AI. Dipanggil **sekali di akhir sesi**.

---

## 1. Prinsip Pemisahan

- Persona (TRD-04) = **lawan**; Evaluator (di sini) = **juri**. Panggilan & prompt **independen**.
- Evaluator menerima: `motion_text`, `context`, **teks utuh 3 argumen user**, dan ringkas sanggahan AI (konteks untuk Responsiveness). Evaluator **tidak** diberi tahu stance/posisi AI agar netral (FR-37).
- Konsekuensi: skor user **tidak boleh** berbeda hanya karena persona berbeda.

---

## 2. Dimensi, Bobot, Skala

| Dimensi | Bobot | Skala 1–5 menilai |
|---|---|---|
| **Penalaran** | 35% | klaim jelas, alur logis, ditopang alasan/contoh |
| **Relevansi** | 25% | argumen diarahkan ke **mosi** (gate) |
| **Responsiveness** | 25% | argumen menjawab **sanggahan AI** lintas ronde |
| **Kejelasan** | 15% | keterbacaan, struktur, bahasa |

**Anchor 1–5 (generik; tiap dimensi diberi anchor spesifik di prompt):**
- 1 = gagal total · 2 = lemah/cacat · 3 = memadai · 4 = kuat · 5 = sangat kuat.

---

## 3. Agregasi & Gate

```
raw = 0.35*Penalaran + 0.25*Relevansi + 0.25*Responsiveness + 0.15*Kejelasan   // skala 1..5
total_100 = round((raw - 1) / 4 * 100)                                          // rescale 1..5 → 0..100

// GATE RELEVANSI
if (Relevansi <= 2) total_100 = round(total_100 * 0.5)   // cap; faktor dapat dituning
```
- Simpan skor mentah per dimensi (1–5) **dan** `total_score` (0–100).
- Faktor gate (0.5) = parameter; final dipatok saat tuning.

---

## 4. Prompt Evaluator (skeleton)

**Model:** `MODEL_EVALUATOR` (Flash default; naikkan kelas bila kualitas kurang).

```
PERAN: Kamu juri argumentasi NETRAL berbahasa Indonesia. Nilai HANYA argumen user
terhadap mosi & sanggahan lawan. Kamu TIDAK memihak sisi mana pun.

MOSI: {motion_text}
KONTEKS: {context}
ARGUMEN USER (R1): {u1}
ARGUMEN USER (R2): {u2}
ARGUMEN USER (R3): {u3}
RINGKAS SANGGAHAN LAWAN: {ai_summary_r1..r2}

Nilai 4 dimensi, skala 1–5 (pakai rentang penuh; jangan menumpuk di 3–4):
- penalaran: {anchor}
- relevansi: {anchor}   // seberapa nyambung ke MOSI
- responsiveness: {anchor}  // seberapa user menjawab sanggahan lawan lintas ronde
- kejelasan: {anchor}
Beri rationale 1 kalimat/dimensi + feedback membangun 2–3 kalimat.

KEMBALIKAN HANYA JSON:
{"penalaran":n,"relevansi":n,"responsiveness":n,"kejelasan":n,
 "rationale":{"penalaran":"...","relevansi":"...","responsiveness":"...","kejelasan":"..."},
 "feedback":"..."}
```

**Anti bias klaster tengah:** prompt mewajibkan rentang penuh + (opsional) 1 few-shot per level ekstrem. Pantau distribusi skor saat uji.

---

## 5. Verdict (opsional, presentasi)

Turunan dari skor yang **sudah ada** (nol panggilan LLM):
```
base = 0.5*Responsiveness + 0.5*Penalaran   // 1..5
if base >= 4   → "Argumen Bertahan"
elif base >= 2.5 → "Imbang Ketat"
else           → "Argumen Runtuh"
```
Disimpan di `session.verdict`. Dipakai dashboard & share (TRD-06). Status: putusan development.

---

## 6. Penyimpanan ML-Ready

Tiap evaluasi menulis ke `session`: 4 skor (1–5), `rationale` (JSONB), `total_score`, `feedback`, `rubric_version`, `model_version`.
- **`rubric_version`** dinaikkan tiap kali anchor/bobot berubah → label tidak tercampur antar versi (NFR-18).
- Struktur per-dimensi ini = **dataset latih IndoBERT** (TRD-08) tanpa transformasi.

---

## 7. Integrasi IndoBERT (opsional, TRD-08)

Bila `INDOBERT_SERVICE_URL` di-set:
```
- Penalaran/Relevansi/Kejelasan ← IndoBERT (per argumen / agregat)
- Responsiveness ← TETAP LLM (butuh konteks multi-giliran)
- feedback naratif ← TETAP LLM
- Bila layanan IndoBERT gagal/timeout → FALLBACK penuh ke evaluator LLM (NFR-15)
```
Skema `session` tidak berubah; hanya sumber angka sebagian dimensi.

---

## 8. Error & Fallback
- Evaluator LLM gagal parse → skor default netral (mis. semua 3) + tandai sesi untuk tinjauan; `total_score` dihitung dari default. User tetap bisa menutup sesi.
- Nilai di luar 1–5 dari LLM → clamp ke rentang.
