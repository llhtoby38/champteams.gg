-- Remove mega forms not available in Pokemon Champions
-- Run: 2026-04-15
-- Source: data/mods/champions/items.ts — only stones with isNonstandard: null are available

-- Remove from all formats (Z-variants and Raichu Megas don't exist in Champions)
DELETE FROM pokemon_formats WHERE pokemon_id IN (
  'absolmegaz', 'garchompmegaz', 'lucariomegaz', 'raichumegax', 'raichumegay'
);

-- Mark unavailable mega stones as non-VGC-relevant so they don't appear in item picker
UPDATE items SET is_vgc_relevant = false WHERE name IN (
  'Absolite Z', 'Garchompite Z', 'Lucarionite Z', 'Raichunite X', 'Raichunite Y',
  'Darkranite', 'Dragalgite', 'Eelektrossite', 'Falinksite', 'Golisopite', 'Heatranite'
);
