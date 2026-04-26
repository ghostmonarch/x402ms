CREATE TABLE IF NOT EXISTS doctor_runs (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  event_date TEXT NOT NULL,
  project_hash TEXT NOT NULL,
  version TEXT NOT NULL,
  status TEXT NOT NULL,
  ci INTEGER NOT NULL,
  strict INTEGER NOT NULL,
  applicable INTEGER NOT NULL,
  has_payment_flow INTEGER NOT NULL,
  has_unprotected_payment_files INTEGER NOT NULL,
  finding_count INTEGER NOT NULL,
  sandbox_passed INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS doctor_runs_event_date_idx
ON doctor_runs (event_date);

CREATE INDEX IF NOT EXISTS doctor_runs_project_date_idx
ON doctor_runs (project_hash, event_date);
