ALTER TABLE doctor_runs ADD COLUMN project_scope INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS doctor_runs_project_scope_idx
ON doctor_runs (project_hash, project_scope, received_at);
