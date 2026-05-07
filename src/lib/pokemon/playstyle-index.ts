/**
 * Builds a derived playstyle tag index from DB data (abilities + learnsets).
 *
 * Unlike the static POKEMON_ROLE_TAGS map, this inspects every roster Pokemon's
 * actual abilities and movepool to produce tags — so e.g. Manectric picks up
 * `intimidate` via its Mega form, and Sableye picks up `screens-setter` because
 * it learns Light Screen/Reflect. Mega form abilities are inherited into the
 * base species so users find them when browsing the base.
 */
import { db } from '@/lib/db';
import { pokemon, pokemonFormats, learnsets, moves } from '@/lib/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

/** Ability → playstyle tag(s) */
const ABILITY_TAGS: Record<string, string[]> = {
  Intimidate: ['intimidate'],
  Drizzle: ['weather-setter'],
  Drought: ['weather-setter'],
  'Sand Stream': ['weather-setter'],
  'Snow Warning': ['weather-setter'],
  'Orichalcum Pulse': ['weather-setter'],
  'Hadron Engine': ['weather-setter'],
  'Friend Guard': ['friend-guard'],
  'Shadow Tag': ['trapper'],
  'Arena Trap': ['trapper'],
  Chlorophyll: ['weather-abuser'],
  'Swift Swim': ['weather-abuser'],
  'Sand Rush': ['weather-abuser'],
  'Slush Rush': ['weather-abuser'],
  'Solar Power': ['weather-abuser'],
};

/** Move name → playstyle tag(s) */
const MOVE_TAGS: Record<string, string[]> = {
  'Fake Out': ['fake-out'],
  'Follow Me': ['redirector'],
  'Rage Powder': ['redirector'],
  'Light Screen': ['screens-setter'],
  Reflect: ['screens-setter'],
  'Aurora Veil': ['screens-setter'],
  Tailwind: ['tailwind-setter'],
  'Trick Room': ['trick-room-setter'],
  'Icy Wind': ['speed-control'],
  Electroweb: ['speed-control'],
  'Thunder Wave': ['speed-control', 'status-spreader'],
  'Swords Dance': ['setup-sweeper'],
  'Nasty Plot': ['setup-sweeper'],
  'Calm Mind': ['setup-sweeper'],
  'Dragon Dance': ['setup-sweeper'],
  'Shell Smash': ['setup-sweeper'],
  'Quiver Dance': ['setup-sweeper'],
  'Bulk Up': ['setup-sweeper'],
  Wish: ['healer'],
  'Life Dew': ['healer'],
  'Heal Pulse': ['healer'],
  'Floral Healing': ['healer'],
  'Extreme Speed': ['priority-user'],
  'Bullet Punch': ['priority-user'],
  'Mach Punch': ['priority-user'],
  'Aqua Jet': ['priority-user'],
  'Sucker Punch': ['priority-user'],
  'Shadow Sneak': ['priority-user'],
  'Ice Shard': ['priority-user'],
  'Will-O-Wisp': ['status-spreader'],
  Toxic: ['status-spreader'],
  Spore: ['status-spreader'],
  'Sleep Powder': ['status-spreader'],
  'U-turn': ['support-pivot'],
  'Volt Switch': ['support-pivot'],
  'Parting Shot': ['support-pivot'],
  'Flip Turn': ['support-pivot'],
  'Helping Hand': ['support'],
};

type PlaystyleIndex = Record<string, string[]>;

/**
 * Returns { [pokemonName]: string[] } keyed by display name (e.g. "Manectric").
 * Mega abilities are merged back into their base species.
 */
export async function buildPlaystyleIndex(formatId: string): Promise<PlaystyleIndex> {
  // 1. Get all pokemon in the format (including mega forms — we need them for ability inheritance)
  const rosterRows = await db
    .select({
      id: pokemon.id,
      name: pokemon.name,
      abilities: pokemon.abilities,
      baseSpecies: pokemon.baseSpecies,
    })
    .from(pokemon)
    .innerJoin(pokemonFormats, eq(pokemon.id, pokemonFormats.pokemonId))
    .where(and(eq(pokemonFormats.formatId, formatId), eq(pokemonFormats.isBanned, false)));

  // Also fetch mega forms for any base species in the roster, even if the mega itself isn't in the format table.
  const baseNames = new Set(rosterRows.filter(r => !r.baseSpecies).map(r => r.name));
  const megaRows = baseNames.size > 0
    ? await db
        .select({ id: pokemon.id, name: pokemon.name, abilities: pokemon.abilities, baseSpecies: pokemon.baseSpecies })
        .from(pokemon)
        .where(inArray(pokemon.baseSpecies, Array.from(baseNames)))
    : [];

  // Build ability → tag inheritance. For each base species, collect abilities from itself + all its mega/other formes.
  // Key by display name.
  const allRows = [...rosterRows];
  for (const m of megaRows) {
    if (!allRows.find(r => r.id === m.id)) allRows.push(m);
  }

  // Map base name → rows (base + formes)
  const byBase = new Map<string, typeof allRows>();
  for (const row of allRows) {
    const baseName = row.baseSpecies || row.name;
    if (!byBase.has(baseName)) byBase.set(baseName, []);
    byBase.get(baseName)!.push(row);
  }

  // 2. Fetch learnsets for all roster pokemon in one go, including base forms of mega/alt formes
  const allIds = allRows.map(r => r.id);
  const learnsetRows = allIds.length > 0
    ? await db
        .select({ pokemonId: learnsets.pokemonId, moveName: moves.name })
        .from(learnsets)
        .innerJoin(moves, eq(learnsets.moveId, moves.id))
        .where(inArray(learnsets.pokemonId, allIds))
    : [];

  // Group moves by pokemon id
  const movesByPid = new Map<string, Set<string>>();
  for (const row of learnsetRows) {
    if (!movesByPid.has(row.pokemonId)) movesByPid.set(row.pokemonId, new Set());
    movesByPid.get(row.pokemonId)!.add(row.moveName);
  }

  const index: PlaystyleIndex = {};

  const addTag = (name: string, tag: string) => {
    if (!index[name]) index[name] = [];
    if (!index[name].includes(tag)) index[name].push(tag);
  };

  // 3. For each roster pokemon (including megas so users can search mega forms directly),
  //    derive tags from its abilities + learnset. Also propagate tags from mega formes onto base.
  for (const row of allRows) {
    const abilityNames = Object.values((row.abilities || {}) as Record<string, string>);
    const ownMoves = movesByPid.get(row.id) || new Set();

    for (const ab of abilityNames) {
      const tags = ABILITY_TAGS[ab];
      if (!tags) continue;
      for (const t of tags) addTag(row.name, t);
      // Propagate to base species (so base Manectric shows under Intimidate via Mega Manectric)
      if (row.baseSpecies) {
        for (const t of tags) addTag(row.baseSpecies, t);
      }
    }

    for (const moveName of ownMoves) {
      const tags = MOVE_TAGS[moveName];
      if (!tags) continue;
      for (const t of tags) addTag(row.name, t);
      if (row.baseSpecies) {
        for (const t of tags) addTag(row.baseSpecies, t);
      }
    }

    // Tag mega formes as mega-evolution and inherit that onto the base as well
    if (row.name.includes('-Mega')) {
      addTag(row.name, 'mega-evolution');
      if (row.baseSpecies) addTag(row.baseSpecies, 'mega-evolution');
    }
  }

  return index;
}
