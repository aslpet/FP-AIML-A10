-- =============================================================================
-- debat.in — Migration 0001: Skema Database Awal
-- Acuan: TRD-01 §2 (DDL), §3 (Integritas), §4 (RLS)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. ENUM
-- ---------------------------------------------------------------------------

CREATE TYPE claim_form AS ENUM ('kebijakan', 'fakta', 'nilai');
CREATE TYPE category_t AS ENUM (
  'politik_hukum',
  'ekonomi',
  'teknologi',
  'sosial_pendidikan',
  'lingkungan'
);
CREATE TYPE motion_status AS ENUM ('candidate', 'queued', 'live', 'retired');
CREATE TYPE stance_policy AS ENUM ('kontrarian', 'berpendirian');
CREATE TYPE rhetoric_style AS ENUM (
  'penuntut',
  'skeptis',
  'pragmatis',
  'idealis',
  'analis_data'
);
CREATE TYPE report_target AS ENUM ('motion', 'ai_response');

-- ---------------------------------------------------------------------------
-- 2. TABEL daily_motion
-- ---------------------------------------------------------------------------

CREATE TABLE daily_motion (
  motion_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  motion_text    TEXT NOT NULL,
  context        TEXT NOT NULL,
  claim_form     claim_form NOT NULL,
  category       category_t NOT NULL,

  -- provenance (denormalisasi dari berita)
  source_title   TEXT,
  source_url     TEXT,
  source_outlet  TEXT,
  source_date    DATE,
  source_id      TEXT NOT NULL,

  -- persona menempel ke mosi (di-set saat promote)
  persona_stance stance_policy NOT NULL,
  persona_style  rhetoric_style NOT NULL,
  ai_position    TEXT,

  -- lifecycle
  status         motion_status NOT NULL DEFAULT 'candidate',
  live_date      DATE,
  quality_score  NUMERIC(4, 2),
  safety_flags   JSONB DEFAULT '{}'::jsonb,
  report_count   INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maksimal 1 mosi live per kategori per hari
CREATE UNIQUE INDEX uq_live_per_category_per_day
  ON daily_motion (category, live_date)
  WHERE status = 'live';

-- Maksimal 1 mosi live per berita per hari (anti-redundansi)
CREATE UNIQUE INDEX uq_live_per_source_per_day
  ON daily_motion (source_id, live_date)
  WHERE status = 'live';

CREATE INDEX idx_motion_queue ON daily_motion (status, category, created_at);
CREATE INDEX idx_motion_live ON daily_motion (live_date, category)
  WHERE status = 'live';

-- ---------------------------------------------------------------------------
-- 3. TABEL app_user
-- ---------------------------------------------------------------------------

CREATE TABLE app_user (
  uid              UUID PRIMARY KEY,
  is_anonymous     BOOLEAN NOT NULL DEFAULT true,
  streak_count     INT NOT NULL DEFAULT 0,
  last_played_date DATE,
  consent_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 4. TABEL assignment
-- ---------------------------------------------------------------------------

CREATE TABLE assignment (
  uid        UUID NOT NULL REFERENCES app_user(uid),
  play_date  DATE NOT NULL,
  category   category_t NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (uid, play_date)
);

-- ---------------------------------------------------------------------------
-- 5. TABEL session
-- ---------------------------------------------------------------------------

CREATE TABLE session (
  session_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid                   UUID NOT NULL REFERENCES app_user(uid),
  play_date             DATE NOT NULL,
  category              category_t NOT NULL,
  motion_id             UUID NOT NULL REFERENCES daily_motion(motion_id),

  -- transkrip debat
  transcript            JSONB NOT NULL DEFAULT '[]'::jsonb,
  current_round         INT NOT NULL DEFAULT 0,
  finished              BOOLEAN NOT NULL DEFAULT false,

  -- penilaian (diisi di akhir sesi)
  score_penalaran       SMALLINT CHECK (score_penalaran BETWEEN 1 AND 5),
  score_relevansi       SMALLINT CHECK (score_relevansi BETWEEN 1 AND 5),
  score_responsiveness  SMALLINT CHECK (score_responsiveness BETWEEN 1 AND 5),
  score_kejelasan       SMALLINT CHECK (score_kejelasan BETWEEN 1 AND 5),

  rationale             JSONB,
  total_score           SMALLINT,
  feedback              TEXT,
  verdict               TEXT,

  -- versioning untuk ML-ready
  rubric_version        TEXT NOT NULL DEFAULT '1.0',
  model_version         TEXT NOT NULL DEFAULT '',

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at           TIMESTAMPTZ,

  -- 1 sesi per user per hari per kategori
  CONSTRAINT uq_session UNIQUE (uid, play_date, category)
);

CREATE INDEX idx_session_user_time ON session (uid, play_date DESC);
CREATE INDEX idx_session_motion ON session (motion_id);

-- ---------------------------------------------------------------------------
-- 6. TABEL report
-- ---------------------------------------------------------------------------

CREATE TABLE report (
  report_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type report_target NOT NULL,
  motion_id   UUID REFERENCES daily_motion(motion_id),
  session_id  UUID REFERENCES session(session_id),
  uid         UUID NOT NULL REFERENCES app_user(uid),
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1 laporan unik per user per mosi (untuk ambang "laporan unik")
  CONSTRAINT uq_report_unique UNIQUE (motion_id, uid)
);

-- ---------------------------------------------------------------------------
-- 7. ROW-LEVEL SECURITY (RLS)
-- ---------------------------------------------------------------------------

ALTER TABLE session   ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user  ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment ENABLE ROW LEVEL SECURITY;
ALTER TABLE report    ENABLE ROW LEVEL SECURITY;

-- User hanya boleh baca/tulis barisnya sendiri
CREATE POLICY own_session ON session
  USING (uid = auth.uid())
  WITH CHECK (uid = auth.uid());

CREATE POLICY own_user ON app_user
  USING (uid = auth.uid())
  WITH CHECK (uid = auth.uid());

CREATE POLICY own_assignment ON assignment
  USING (uid = auth.uid())
  WITH CHECK (uid = auth.uid());

CREATE POLICY insert_report ON report
  FOR INSERT
  WITH CHECK (uid = auth.uid());
