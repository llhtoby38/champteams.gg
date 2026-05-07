-- Add Floette-Eternal as a separate species
-- Run: 2026-04-15
-- Floette-Eternal is the only form in Champions (base Floette is not playable).
-- Only Floette-Eternal can Mega Evolve to Floette-Mega.

INSERT INTO pokemon (id, name, dex_num, types, base_stats, abilities, base_species, sprite_id, heightm, weightkg)
VALUES (
  'floetteeternal', 'Floette-Eternal', 670,
  '{Fairy}',
  '{"hp": 74, "atk": 65, "def": 67, "spa": 125, "spd": 128, "spe": 92}',
  '{"0": "Flower Veil", "H": "Symbiosis"}',
  'Floette', 'floette-eternal', 0.2, 0.9
) ON CONFLICT DO NOTHING;

INSERT INTO pokemon_formats (pokemon_id, format_id, is_restricted, is_banned) VALUES
  ('floetteeternal', 'season-m1', false, false),
  ('floetteeternal', 'champions-all', false, false)
ON CONFLICT DO NOTHING;

-- Update Mega Floette to have Floette-Eternal as base (only Eternal can mega)
UPDATE pokemon SET base_species = 'Floette-Eternal' WHERE id = 'floettemega';

-- Add learnset from Champions Showdown mod
INSERT INTO learnsets (pokemon_id, move_id, learn_method)
SELECT 'floetteeternal', m.id, 'champions'
FROM moves m
WHERE m.id IN (
  'alluringvoice','batonpass','calmmind','charm','chillingwater','copycat',
  'dazzlinggleam','drainingkiss','endeavor','endure','energyball','facade',
  'gigadrain','grassknot','grassyterrain','helpinghand','hyperbeam',
  'lightofruin','lightscreen','mistyterrain','moonblast','petalblizzard',
  'petaldance','pollenpuff','protect','psychic','raindance','rest',
  'safeguard','seedbomb','skillswap','sleeptalk','solarbeam','storedpower',
  'substitute','sunnyday','synthesis','tearfullook','trailblaze','trick','wish'
)
ON CONFLICT DO NOTHING;
