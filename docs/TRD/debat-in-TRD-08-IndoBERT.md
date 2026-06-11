# TRD-08 — Layanan IndoBERT (Opsional) · debat.in

| | |
|---|---|
| **Komponen** | Argument Quality Scorer (microservice Python/FastAPI) |
| **Versi** | 1.0 · Draft |
| **Status** | **OPSIONAL / enhancement** — tidak wajib untuk FP |
| **Acuan** | TRD-05 §7 (integrasi); TRD-01 (`session` sbg sumber data); SRS FR-41, EIR-5, NFR-10/15 |

> Ditulis detail agar **tinggal eksekusi** bila tim sempat. Jika tidak digarap: kosongkan `INDOBERT_SERVICE_URL` → seluruh penilaian tetap jalan via evaluator LLM (TRD-05). Tidak ada perubahan pada komponen lain.

---

## 1. Tujuan & Justifikasi

Memindahkan **sebagian penilaian angka** dari LLM ke model yang dilatih sendiri → penilaian lebih **deterministik/reproducible** & **terukur kuantitatif** (MAE/korelasi vs gold set). Memperkuat proyek sebagai AI/ML (ada model dilatih sendiri, bukan murni integrasi API).

---

## 2. Pembagian Dimensi (penting)

| Dimensi | Sumber skor |
|---|---|
| Penalaran | **IndoBERT** |
| Relevansi | **IndoBERT** (didukung sinyal embedding mosi–argumen) |
| Kejelasan | **IndoBERT** |
| **Responsiveness** | **TETAP LLM** — butuh konteks multi-giliran, sulit untuk model teks-tunggal |
| feedback naratif | **TETAP LLM** |

---

## 3. Arsitektur & Kontrak

```
Next.js evaluator (TRD-05)  ──HTTP internal/private──▶  FastAPI (Python)
                                                          IndoBERT inference
```
- **Tidak diekspos publik** (NFR-10). Hanya backend memanggil via `INDOBERT_SERVICE_URL` (jaringan privat / secret token).
- **Endpoint:** `POST /score`
  - **Req:** `{ "motion": "...", "argument": "..." }` (argument = gabungan/representasi argumen user)
  - **Resp:** `{ "penalaran": 0.0–1.0, "relevansi": 0.0–1.0, "kejelasan": 0.0–1.0 }`
- Next.js memetakan 0–1 → skala 1–5 (kalibrasi saat tuning), lalu menggabung dengan Responsiveness (LLM) untuk agregasi (TRD-05 §3).
- **Fallback:** timeout/5xx → evaluator LLM penuh (NFR-15).

**Mengapa FastAPI:** validasi tipe (Pydantic) untuk kontrak skor, async untuk inference, auto-docs (Swagger), standar de-facto ML serving. (FastAPI di sini perannya sempit: bungkus model, bukan seluruh backend.)

---

## 4. Model

- **Base:** IndoBERT (mis. `indobenchmark/indobert-base-p1`) via HuggingFace Transformers.
- **Head:** regresi multi-output (3 dimensi) atau ordinal — output 0–1 per dimensi.
- **Input:** pasangan `[mosi] [SEP] [argumen]` (memberi sinyal relevansi ke mosi sekaligus).
- **Serving:** muat model sekali saat start; inference batch-1 cukup untuk skala FP.

---

## 5. Dataset (LLM Distillation)

| Sumber | Konten | Peran |
|---|---|---|
| `session` (TRD-01) | argumen riil + skor per-dimensi LLM | data pemakaian (silver) |
| Synthetic LLM-generated | ~500–1000 argumen lemah/sedang/kuat lintas mosi | silver labels |
| Label-tangan | ~100–200 sampel | **gold test set** |
| IndoNLI (opsional) | NLI Bahasa Indonesia | sinyal pre-training tambahan |

**Proses:**
```
1. Kumpulkan argumen (dari session + generate sintetis lintas mosi & kualitas).
2. Label per-dimensi via LLM kuat berbasis rubrik (anchor 1–5) → silver.
3. Label-tangan ~100–200 → gold (untuk evaluasi, JANGAN dilatih).
4. Fine-tune IndoBERT (regresi 3 output), normalisasi label ke 0–1.
5. Evaluasi: MAE & korelasi (Spearman/Pearson) vs gold per dimensi.
```
**Konsistensi:** gunakan `rubric_version` (TRD-01/05) agar label silver tidak campur antar versi rubrik.

---

## 6. Training (ringkas)

- Split: train/val dari silver; **test = gold** (terpisah, label-tangan).
- Loss: MSE/SmoothL1 (regresi) atau ordinal loss.
- Metrik lapor (untuk laporan FP): **MAE per dimensi** + **korelasi vs gold** + distribusi prediksi (cek bias klaster tengah).
- Catatan: waspada **silver bias** — jika LLM jarang memberi 1/5, model ikut timpang; mitigasi: seimbangkan distribusi sintetis + cek vs gold.

---

## 7. Deployment

- Container Python terpisah (mis. host model kecil). Muat bobot saat start.
- Env backend: `INDOBERT_SERVICE_URL` (kosong = fitur mati). Token/secret untuk panggilan internal.
- **Bukan** di jalur kritis: kegagalan → fallback LLM; produk tetap utuh.

---

## 8. Checklist Aktivasi
1. Latih & simpan model (capai MAE/korelasi memadai vs gold).
2. Deploy FastAPI `/score` di jaringan privat.
3. Set `INDOBERT_SERVICE_URL` (+ secret) di backend.
4. Aktifkan path IndoBERT di evaluator (TRD-05 §7); verifikasi fallback bekerja saat layanan dimatikan.
5. Laporkan metrik di dokumen FP.
