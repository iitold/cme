-- 001_doctors.sql
CREATE TABLE doctors (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  full_name          TEXT NOT NULL,
  date_of_birth      DATE,
  phone              TEXT,

  cchn_number        TEXT UNIQUE,
  cchn_issued_date   DATE,
  cchn_cycle_start   DATE,
  cchn_cycle_end     DATE GENERATED ALWAYS AS
                       (cchn_cycle_start + INTERVAL '5 years') STORED,

  specialty          TEXT,
  workplace          TEXT,
  province           TEXT,

  cme_target_credits INT DEFAULT 120,
  cme_min_per_year   INT DEFAULT 12,

  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctors: own row only"
  ON doctors USING (user_id = auth.uid());
