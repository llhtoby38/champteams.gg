-- Suggested Partners feature.
-- Pre-computed co-occurrence + win-rate stats per (primary, partner) pair so
-- the builder page can fetch top partners without self-joining a ~4k-row
-- tournament_entries table on every request.
--
-- Two rows per pair (A→B and B→A) — co_occurrence_pct is direction-specific
-- (% of A's teams that include B differs from % of B's teams that include A).
--
-- Apply locally: psql $DATABASE_URL -f drizzle/manual/010_create_pokemon_pair_stats.sql
-- Apply on prod: same, with prod DATABASE_URL.

CREATE TABLE IF NOT EXISTS pokemon_pair_stats (
  format_id           TEXT      NOT NULL,
  primary_id          TEXT      NOT NULL,
  partner_id          TEXT      NOT NULL,
  primary_name        TEXT      NOT NULL,
  partner_name        TEXT      NOT NULL,
  co_count            INTEGER   NOT NULL,
  primary_count       INTEGER   NOT NULL,
  co_occurrence_pct   REAL      NOT NULL,
  win_rate_together   REAL,
  smogon_teammate_pct REAL,
  updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (format_id, primary_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_pps_primary ON pokemon_pair_stats (format_id, primary_id);
