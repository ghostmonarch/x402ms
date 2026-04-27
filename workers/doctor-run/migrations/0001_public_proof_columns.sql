ALTER TABLE doctor_runs ADD COLUMN detected_rails TEXT NOT NULL DEFAULT '';
ALTER TABLE doctor_runs ADD COLUMN proof_source TEXT NOT NULL DEFAULT 'external-reported';

CREATE INDEX IF NOT EXISTS doctor_runs_proof_source_idx
ON doctor_runs (proof_source, event_date);
