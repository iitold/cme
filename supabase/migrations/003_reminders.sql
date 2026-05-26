-- 003_reminders.sql
CREATE TABLE reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID REFERENCES doctors(id) ON DELETE CASCADE,

  reminder_type TEXT NOT NULL CHECK (reminder_type IN
                  ('deadline_3mo','deadline_2mo','deadline_1mo',
                   'deadline_2w','yearly_deficit')),

  -- channel = 'zalo' sẽ dùng ở Phase 2
  channel       TEXT NOT NULL DEFAULT 'email'
                CHECK (channel IN ('email','zalo')),

  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','sent','failed')),

  credits_at_time  INT,
  deadline_at_time DATE,

  triggered_at  TIMESTAMPTZ DEFAULT now(),
  sent_at       TIMESTAMPTZ
);

CREATE INDEX idx_reminders_doctor_id ON reminders(doctor_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reminders: own reminders only"
  ON reminders
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));
