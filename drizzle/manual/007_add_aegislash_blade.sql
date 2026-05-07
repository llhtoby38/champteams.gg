-- Add Aegislash-Blade form for battle form switching
-- Run: 2026-04-15

INSERT INTO pokemon (id, name, dex_num, types, base_stats, abilities, base_species, sprite_id, heightm, weightkg)
VALUES (
  'aegislashblade', 'Aegislash-Blade', 681,
  '{Steel,Ghost}',
  '{"hp": 60, "atk": 140, "def": 50, "spa": 140, "spd": 50, "spe": 60}',
  '{"0": "Stance Change"}',
  'Aegislash', 'aegislash-blade', 1.7, 53.0
) ON CONFLICT DO NOTHING;

INSERT INTO pokemon_formats (pokemon_id, format_id, is_restricted, is_banned) VALUES
  ('aegislashblade', 'season-m1', false, false),
  ('aegislashblade', 'champions-all', false, false)
ON CONFLICT DO NOTHING;
