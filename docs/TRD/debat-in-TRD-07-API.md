# TRD-07 — Kontrak API · debat.in

| | |
|---|---|
| **Komponen** | Kontrak REST API (Next.js Route Handlers) |
| **Versi** | 1.0 · Draft |
| **Acuan** | TRD-02/04/05/06; SRS §3.1–3.2 |

> Semua endpoint same-origin (tanpa CORS). Auth via token Supabase di header (`Authorization: Bearer <access_token>`) kecuali cron. Body JSON. Endpoint mutasi data user dieksekusi server-side (service role) setelah verifikasi token.

---

## 1. Konvensi

- **Auth:** `Authorization: Bearer <supabase_access_token>` → backend resolve `uid`.
- **Error:** `{ "error": { "code": "...", "message": "..." } }`, HTTP 4xx/5xx.
- **Tanggal:** server menentukan `play_date` (WIB) — client tidak mengirim tanggal.

---

## 2. Sesi

### `GET /api/session/today`
Mendapatkan/menyiapkan sesi hari ini untuk user (assignment terkunci).
**Resp 200:**
```json
{
  "state": "new | in_progress | finished",
  "category": "ekonomi",
  "motion": { "motion_id":"…", "motion_text":"…", "context":"…", "claim_form":"kebijakan" },
  "session_id": "… (jika sudah ada)",
  "transcript": [ { "role":"ai","content":"…","round":0 } ],
  "current_round": 0,
  "result": { /* jika finished: skor, dst (lihat /result) */ }
}
```

### `POST /api/session/start`
Memulai sesi (membuat baris `session`, memicu opening AI).
**Body:** `{ "category": "ekonomi" }` (opsional; default = assignment hari ini)
**Resp 200:** `{ "session_id":"…", "ai_message":"…(opening)…", "current_round":0 }`

### `POST /api/session/respond`
Mengirim argumen user untuk ronde berjalan.
**Body:** `{ "session_id":"…", "user_message":"…" }`
**Resp 200 (ronde 1–2):**
```json
{ "ai_message":"…(tanggapan)…", "current_round":2, "finished":false }
```
**Resp 200 (ronde 3 → selesai):**
```json
{
  "ai_message":"…(penutup)…",
  "finished": true,
  "result": {
    "scores": { "penalaran":4,"relevansi":3,"responsiveness":4,"kejelasan":4 },
    "total_score": 78,
    "rationale": { "penalaran":"…", "relevansi":"…", "responsiveness":"…","kejelasan":"…" },
    "feedback":"…",
    "verdict":"Argumen Bertahan"
  }
}
```

### `POST /api/session/next-category`
Mengambil kategori aktif lain yang belum dimainkan (bonus).
**Resp 200:** `{ "category":"…", "motion":{…} }` · **Resp 204:** tidak ada kategori tersisa.

---

## 3. Hasil & Riwayat

### `GET /api/session/result?session_id=…`
**Resp 200:** objek `result` (sama seperti di `respond` finish) + `motion`, `category`, `play_date`.

### `GET /api/history?limit=30&before=…`
**Resp 200:**
```json
{
  "sessions": [
    { "play_date":"2026-06-12","category":"ekonomi","motion_text":"…",
      "total_score":78,"scores":{…} }
  ],
  "trend": { "penalaran":[…],"relevansi":[…],"responsiveness":[…],"kejelasan":[…] }
}
```

### `GET /api/me`
**Resp 200:** `{ "uid":"…","is_anonymous":true,"streak_count":5,"last_played_date":"…","consent":true }`

### `POST /api/me/consent`
**Resp 200:** `{ "ok": true }` (set `consent_at`).

---

## 4. Pelaporan

### `POST /api/report`
**Body:**
```json
{ "target_type":"motion|ai_response", "motion_id":"…", "session_id":"… (untuk ai_response)", "reason":"opsional" }
```
**Resp 200:** `{ "ok": true }` (idempoten per user per mosi).
Server: insert `report`; jika `motion` → `report_count++`, retire bila ≥ ambang (TRD-03 §6).

---

## 5. Cron (internal)

### `GET /api/cron/daily`
**Header:** `Authorization: Bearer <CRON_SECRET>`
**Resp 200:** `{ "ran": true, "summary": { "ekonomi":"fresh", "teknologi":"queue", … } }`
Idempoten per `(tanggal, kategori)`; menjalankan pipeline (TRD-02).

---

## 6. Ringkas Endpoint

| Method | Path | Auth | Komponen |
|---|---|---|---|
| GET | `/api/session/today` | user | TRD-04 |
| POST | `/api/session/start` | user | TRD-04 |
| POST | `/api/session/respond` | user | TRD-04/05 |
| POST | `/api/session/next-category` | user | TRD-04 |
| GET | `/api/session/result` | user | TRD-05/06 |
| GET | `/api/history` | user | TRD-06 |
| GET | `/api/me` | user | TRD-06 |
| POST | `/api/me/consent` | user | TRD-06 |
| POST | `/api/report` | user | TRD-03/06 |
| GET | `/api/cron/daily` | secret | TRD-02 |
