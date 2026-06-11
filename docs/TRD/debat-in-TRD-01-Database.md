# TRD-01 — Database & Data Model · debat.in

| | |
|---|---|
| **Komponen** | Database & Data Model (Supabase PostgreSQL) |
| **Versi** | 1.0 · Draft |
| **Acuan** | TRD-00; SRS §3.4 (DR-1…DR-6) |

> Fondasi semua komponen. Implementasikan pertama. Semua tabel di skema `public`; akses tulis pipeline/penilaian via **service role** (server-only).

---

## 1. Ringkasan Entitas

| Tabel | Peran | Kunci utama |
|---|---|---|
| `daily_motion` | Mosi + lifecycle pipeline | `motion_id` |
| `session` | Sesi debat + penilaian | `session_id` (unik per `uid,tanggal,category`) |
| `app_user` | Identitas, streak | `uid` |
| `assignment` | Penugasan kategori harian | `(uid, play_date)` |
| `report` | Laporan konten | `report_id` |

Relasi: `session.motion_id → daily_motion`; `session.uid → app_user`; `assignment.uid → app_user`; `report.motion_id → daily_motion`.

---

## 2. DDL

### 2.1 Enum

```sql
CREATE TYPE claim_form   AS ENUM ('kebijakan','fakta','nilai');
CREATE TYPE category_t   AS ENUM ('politik_hukum','ekonomi','teknologi','sosial_pendidikan','lingkungan');
CREATE TYPE motion_status AS ENUM ('candidate','queued','live','retired');
CREATE TYPE stance_policy AS ENUM ('kontrarian','berpendirian');
CREATE TYPE rhetoric_style AS ENUM ('penuntut','skeptis','pragmatis','idealis','analis_data');
CREATE TYPE report_target AS ENUM ('motion','ai_response');
```

### 2.2 `daily_motion`

```sql
CREATE TABLE daily_motion (
  motion_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motion_text   TEXT NOT NULL,
  context       TEXT NOT NULL,              -- 1–2 kalimat netral
  claim_form    claim_form NOT NULL,
  category      category_t NOT NULL,
  -- provenance (denormalisasi)
  source_title  TEXT,
  source_url    TEXT,
  source_outlet TEXT,
  source_date   DATE,
  source_id     TEXT NOT NULL,              -- hash URL berita (grouping)
  -- persona menempel ke mosi
  persona_stance stance_policy NOT NULL,
  persona_style  rhetoric_style NOT NULL,
  ai_position    TEXT,                      -- posisi tetap (mode berpendirian)
  -- lifecycle
  status        motion_status NOT NULL DEFAULT 'candidate',
  live_date     DATE,                       -- tanggal tayang (NULL jika belum)
  quality_score NUMERIC(4,2),               -- skor kelayakan dari ranking
  safety_flags  JSONB DEFAULT '{}'::jsonb,  -- {beban:bool, reframed:bool, ...}
  report_count  INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Integritas: maksimal SATU mosi live per kategori per hari
CREATE UNIQUE INDEX uq_live_per_category_per_day
  ON daily_motion (category, live_date)
  WHERE status = 'live';

-- Integritas: maksimal SATU mosi live per berita per hari (anti-redundansi)
CREATE UNIQUE INDEX uq_live_per_source_per_day
  ON daily_motion (source_id, live_date)
  WHERE status = 'live';

CREATE INDEX idx_motion_queue ON daily_motion (status, category, created_at);
CREATE INDEX idx_motion_live  ON daily_motion (live_date, category) WHERE status='live';
```

### 2.3 `app_user`

```sql
CREATE TABLE app_user (
  uid             UUID PRIMARY KEY,          -- = auth.users.id (Supabase)
  is_anonymous    BOOLEAN NOT NULL DEFAULT true,
  streak_count    INT NOT NULL DEFAULT 0,
  last_played_date DATE,
  consent_at      TIMESTAMPTZ,               -- waktu consent disetujui
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
> Saat user anonim upgrade ke Google, **uid tetap** (link), `is_anonymous=false`. Tidak ada migrasi baris.

### 2.4 `assignment`

```sql
CREATE TABLE assignment (
  uid        UUID NOT NULL REFERENCES app_user(uid),
  play_date  DATE NOT NULL,                  -- WIB
  category   category_t NOT NULL,            -- kategori pertama yang diundi
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (uid, play_date)               -- terkunci: 1 undian/hari
);
```
> Menegakkan anti-reroll (FR-5/FR-7). Undian dilakukan server, dicatat sekali.

### 2.5 `session`

```sql
CREATE TABLE session (
  session_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid          UUID NOT NULL REFERENCES app_user(uid),
  play_date    DATE NOT NULL,                -- WIB
  category     category_t NOT NULL,
  motion_id    UUID NOT NULL REFERENCES daily_motion(motion_id),
  -- transkrip
  transcript   JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{role, content, round}]
  current_round INT NOT NULL DEFAULT 0,
  finished     BOOLEAN NOT NULL DEFAULT false,
  -- penilaian (diisi di akhir)
  score_penalaran   SMALLINT,   -- 1..5
  score_relevansi   SMALLINT,
  score_responsiveness SMALLINT,
  score_kejelasan   SMALLINT,
  rationale    JSONB,           -- {penalaran:"...", relevansi:"...", ...}
  total_score  SMALLINT,        -- 0..100
  feedback     TEXT,
  verdict      TEXT,            -- opsional
  rubric_version TEXT NOT NULL,
  model_version  TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ,
  -- satu sesi per (user, hari, kategori)
  CONSTRAINT uq_session UNIQUE (uid, play_date, category)
);

CREATE INDEX idx_session_user_time ON session (uid, play_date DESC);
CREATE INDEX idx_session_motion ON session (motion_id);
CHECK (score_penalaran BETWEEN 1 AND 5);  -- (+ untuk tiap dimensi)
```

### 2.6 `report`

```sql
CREATE TABLE report (
  report_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type report_target NOT NULL,
  motion_id   UUID REFERENCES daily_motion(motion_id),
  session_id  UUID REFERENCES session(session_id),  -- untuk ai_response
  uid         UUID NOT NULL REFERENCES app_user(uid),
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- 1 laporan unik per user per mosi (untuk ambang "laporan unik")
  CONSTRAINT uq_report_unique UNIQUE (motion_id, uid)
);
```

---

## 3. Aturan Integritas (ringkas)

| Aturan | Penegak |
|---|---|
| Maks 1 mosi `live` / kategori / hari | `uq_live_per_category_per_day` |
| Maks 1 mosi `live` / berita / hari | `uq_live_per_source_per_day` |
| 1 undian kategori / user / hari | PK `assignment(uid, play_date)` |
| 1 sesi / user / hari / kategori | `uq_session` |
| 1 laporan unik / user / mosi | `uq_report_unique` (mendukung ambang `report_count`) |
| Skor dimensi 1..5 | CHECK constraint |

---

## 4. Row-Level Security (RLS)

Supabase mengekspos PostgREST; **RLS wajib aktif** agar client (anon key) tidak bisa membaca/menulis sembarang.

```sql
ALTER TABLE session   ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE report    ENABLE ROW LEVEL SECURITY;

-- User hanya boleh baca/tulis barisnya sendiri
CREATE POLICY own_session ON session
  USING (uid = auth.uid()) WITH CHECK (uid = auth.uid());
CREATE POLICY own_user ON app_user
  USING (uid = auth.uid()) WITH CHECK (uid = auth.uid());
CREATE POLICY own_assignment ON assignment
  USING (uid = auth.uid()) WITH CHECK (uid = auth.uid());
CREATE POLICY insert_report ON report
  FOR INSERT WITH CHECK (uid = auth.uid());
```
- `daily_motion`: **baca publik** untuk mosi `live` (boleh tanpa RLS ketat atau policy read-only `status='live'`); **tulis hanya service role** (pipeline). Operasi penilaian & update streak dilakukan backend memakai **service role** (melewati RLS) — bukan dari client.

---

## 5. Catatan Implementasi

- **uid = auth.users.id Supabase.** Baris `app_user` dibuat saat sesi pertama (upsert) memakai id dari token auth.
- **Penilaian & streak ditulis server-side** (service role), bukan client — mencegah pemalsuan skor/streak.
- **TTL antrian** bukan kolom; ditegakkan pipeline (TRD-02): `status='queued' AND created_at < now()-INTERVAL '3 days'` → set `retired`.
- **`transcript` JSONB** menyimpan urutan giliran; alternatif normalisasi (tabel `turn`) tidak diperlukan untuk skala FP.
- **Peleburan `assignment`** ke `session` dimungkinkan (PRD open decision), tetapi tabel terpisah lebih bersih untuk menegakkan "1 undian/hari" tanpa bergantung keberadaan sesi.
