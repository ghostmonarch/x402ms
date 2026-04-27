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
  sandbox_passed INTEGER NOT NULL,
  detected_rails TEXT NOT NULL DEFAULT '',
  proof_source TEXT NOT NULL DEFAULT 'external-reported'
);

CREATE INDEX IF NOT EXISTS doctor_runs_event_date_idx
ON doctor_runs (event_date);

CREATE INDEX IF NOT EXISTS doctor_runs_project_date_idx
ON doctor_runs (project_hash, event_date);

CREATE INDEX IF NOT EXISTS doctor_runs_proof_source_idx
ON doctor_runs (proof_source, event_date);

CREATE TABLE IF NOT EXISTS discovery_events (
  id TEXT PRIMARY KEY,
  received_at TEXT NOT NULL,
  event_date TEXT NOT NULL,
  event_name TEXT NOT NULL,
  surface TEXT NOT NULL,
  variant TEXT NOT NULL,
  language TEXT NOT NULL,
  languages TEXT NOT NULL,
  referrer_host TEXT NOT NULL,
  landing TEXT NOT NULL,
  intent TEXT NOT NULL,
  utm_source TEXT NOT NULL,
  utm_medium TEXT NOT NULL,
  utm_campaign TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS discovery_events_event_date_idx
ON discovery_events (event_date);

CREATE INDEX IF NOT EXISTS discovery_events_intent_idx
ON discovery_events (intent, event_date);

CREATE INDEX IF NOT EXISTS discovery_events_language_idx
ON discovery_events (language, event_date);
