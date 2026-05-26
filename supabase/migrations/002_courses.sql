-- 002_courses.sql
CREATE TABLE courses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id           UUID REFERENCES doctors(id) ON DELETE CASCADE,

  course_name         TEXT NOT NULL,
  provider_name       TEXT NOT NULL,
  provider_type       TEXT CHECK (provider_type IN
                        ('university','hospital','association','online','other')),

  credits             INT NOT NULL CHECK (credits > 0),
  course_type         TEXT CHECK (course_type IN
                        ('theory','clinical','online','conference')),
  start_date          DATE NOT NULL,
  end_date            DATE NOT NULL,

  -- Trust level — dùng cho Phase 2 (provider portal)
  verification_status TEXT NOT NULL DEFAULT 'self_entered'
                      CHECK (verification_status IN
                        ('self_entered','provider_verified','institution_verified')),

  certificate_url     TEXT,
  certificate_name    TEXT,
  notes               TEXT,

  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_courses_doctor_id ON courses(doctor_id);
CREATE INDEX idx_courses_end_date  ON courses(end_date);

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses: own courses only"
  ON courses
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));
