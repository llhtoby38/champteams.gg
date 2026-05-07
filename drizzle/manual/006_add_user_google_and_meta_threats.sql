-- Add Google OAuth ID and meta threats to users table
-- Run: 2026-04-14

ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS meta_threats JSONB;
