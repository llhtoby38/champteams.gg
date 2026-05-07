-- Create usage_stats table for Smogon usage data caching
-- Run: 2026-04-12
-- Auto-refreshes from smogon.com/stats/ every 24h via /api/usage endpoint

CREATE TABLE IF NOT EXISTS usage_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pokemon_id text NOT NULL,
  format_id text NOT NULL,
  month text NOT NULL,
  usage_percent real NOT NULL,
  raw_count integer NOT NULL,
  moves jsonb NOT NULL,
  items jsonb NOT NULL,
  abilities jsonb NOT NULL,
  spreads jsonb NOT NULL,
  teammates jsonb NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  UNIQUE(pokemon_id, format_id, month)
);
