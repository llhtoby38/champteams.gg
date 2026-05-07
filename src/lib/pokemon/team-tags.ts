/**
 * Auto-detect VGC strategy tags from a team's Pokemon sets.
 * Tags are computed from species names, selected abilities, held items, and moves.
 */

export interface PokemonSetForTags {
  species: string;
  ability?: string;
  item?: string;
  moves?: string[];
  // Optional base stats for archetype detection (hp, atk, def, spa, spd, spe)
  baseStats?: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
}

function normalize(s: string | undefined | null): string {
  return (s || '').toLowerCase().trim();
}

export function computeTeamTags(sets: PokemonSetForTags[]): string[] {
  if (!sets || sets.length === 0) return [];

  const tags = new Set<string>();

  const abilities = sets.map(p => normalize(p.ability));
  const allMoves = sets.flatMap(p => (p.moves || []).map(normalize));
  const species = sets.map(p => normalize(p.species));
  const items = sets.map(p => normalize(p.item));

  const hasAbility = (...ab: string[]) => abilities.some(a => ab.includes(a));
  const hasMove = (...mv: string[]) => mv.some(m => allMoves.includes(m));
  const hasSpecies = (name: string) => species.some(s => s.includes(name));

  // ── Weather ───────────────────────────────────────────────────────────────
  if (hasAbility('drought', 'desolate land', 'mega sol') || hasMove('sunny day'))
    tags.add('weather-sun');
  if (hasAbility('drizzle', 'primordial sea') || hasMove('rain dance'))
    tags.add('weather-rain');
  if (hasAbility('sand stream', 'sand spit') || hasMove('sandstorm'))
    tags.add('weather-sand');
  if (hasAbility('snow warning', 'ice body') || hasMove('hail', 'snowscape'))
    tags.add('weather-snow');

  // ── Speed control ─────────────────────────────────────────────────────────
  if (hasMove('trick room')) tags.add('trick-room');
  if (hasMove('tailwind')) tags.add('tailwind');

  // ── Screens ───────────────────────────────────────────────────────────────
  if (hasMove('light screen', 'reflect', 'aurora veil')) tags.add('screens');

  // ── Intimidate (≥2 Pokemon with Intimidate) ───────────────────────────────
  if (abilities.filter(a => a === 'intimidate').length >= 2) tags.add('intimidate');

  // ── Fake Out support ──────────────────────────────────────────────────────
  if (hasMove('fake out')) tags.add('fake-out');

  // ── Redirection ───────────────────────────────────────────────────────────
  if (hasMove('follow me', 'rage powder')) tags.add('redirection');

  // ── Perish Trap ───────────────────────────────────────────────────────────
  if (hasMove('perish song')) tags.add('perish-trap');

  // ── Commander (Dondozo + any Tatsugiri form) ──────────────────────────────
  if (hasSpecies('dondozo') && hasSpecies('tatsugiri')) tags.add('commander');

  // ── Mega ──────────────────────────────────────────────────────────────────
  const MEGA_STONE_EXCLUSIONS = new Set(['eviolite', 'leftovers', 'sitrus berry']);
  if (items.some(item =>
    item &&
    !MEGA_STONE_EXCLUSIONS.has(item) &&
    (item.endsWith('ite') || item.endsWith('ite x') || item.endsWith('ite y'))
  )) tags.add('mega-focused');

  // ── Terrain ───────────────────────────────────────────────────────────────
  if (hasAbility('electric surge') || hasMove('electric terrain')) tags.add('terrain-electric');
  if (hasAbility('psychic surge') || hasMove('psychic terrain')) tags.add('terrain-psychic');
  if (hasAbility('grassy surge') || hasMove('grassy terrain')) tags.add('terrain-grassy');

  // ── Archetype (only if no dominant strategy already tagged) ──────────────
  if (sets.some(p => p.baseStats)) {
    const avgHp = avg(sets.map(p => p.baseStats?.hp ?? 75));
    const avgOffense = avg(sets.map(p => Math.max(p.baseStats?.atk ?? 80, p.baseStats?.spa ?? 80)));
    const avgBulk = avg(sets.map(p => ((p.baseStats?.hp ?? 75) + (p.baseStats?.def ?? 70) + (p.baseStats?.spd ?? 70)) / 3));

    if (avgOffense >= 110 && avgHp <= 75) tags.add('hyper-offense');
    else if (avgBulk >= 80 && avgOffense >= 95) tags.add('bulky-offense');
  }

  return Array.from(tags);
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/**
 * Merge auto-computed tags with manually assigned tags.
 * Manual tags (from DB) take precedence; computed tags supplement them.
 */
export function mergeTeamTags(manualTags: string[], computedTags: string[]): string[] {
  return Array.from(new Set([...manualTags, ...computedTags]));
}
