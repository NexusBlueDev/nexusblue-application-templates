-- Migration tracking table — records which migrations have been applied
-- Used by scripts/verify-migrations.sh to detect drift between repo and DB
--
-- Reference: Deployment Integrity Protocol (Core DB)
-- Rule #214: Deployment integrity verification required before push
--
-- After applying this migration, seed it with your existing migrations:
--   INSERT INTO _migration_history (migration) VALUES ('001_name'), ('002_name'), ...;

CREATE TABLE IF NOT EXISTS public._migration_history (
  id          serial PRIMARY KEY,
  migration   text NOT NULL UNIQUE,       -- e.g. '001_foundation'
  applied_at  timestamptz NOT NULL DEFAULT now(),
  checksum    text                         -- optional: sha256 of the SQL file
);

-- Service role only — this is infrastructure, not tenant data
ALTER TABLE public._migration_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only on _migration_history"
  ON public._migration_history FOR ALL
  USING (auth.role() = 'service_role');
