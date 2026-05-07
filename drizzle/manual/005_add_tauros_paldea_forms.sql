-- Add missing Tauros Paldea forms to Champions format
-- Run: 2026-04-13
-- Tauros-Paldea-Blaze (Fighting/Fire) and Tauros-Paldea-Aqua (Fighting/Water)
-- were in the pokemon table but not in the season-m1 format

INSERT INTO pokemon_formats (pokemon_id, format_id, is_restricted, is_banned) VALUES
  ('taurospaldeaaqua', 'season-m1', false, false),
  ('taurospaldeablaze', 'season-m1', false, false)
ON CONFLICT DO NOTHING;
