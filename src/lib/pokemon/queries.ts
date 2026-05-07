import { db } from '@/lib/db';
import {
  pokemon, moves, abilities, items, learnsets, natures, typeChart,
  formats, pokemonFormats,
} from '@/lib/db/schema';
import { eq, ilike, sql, and, or, inArray, asc } from 'drizzle-orm';

/**
 * Search Pokemon with optional format filtering.
 * When formatId is provided, only returns Pokemon allowed in that format.
 */
export async function searchPokemon(
  query?: string,
  type?: string,
  limit = 2000,
  formatId?: string,
  moveNames?: string[],
) {
  // If filtering by moves, first find which Pokemon learn ALL specified moves
  let moveFilterIds: Set<string> | null = null;
  if (moveNames && moveNames.length > 0) {
    // Find Pokemon that learn ALL of the specified moves
    const moveRows = await db
      .select({ pokemonId: learnsets.pokemonId, moveName: moves.name })
      .from(learnsets)
      .innerJoin(moves, eq(learnsets.moveId, moves.id))
      .where(inArray(moves.name, moveNames));

    // Group by pokemonId, keep those that match ALL moves
    const pokemonMoves = new Map<string, Set<string>>();
    for (const row of moveRows) {
      if (!pokemonMoves.has(row.pokemonId)) pokemonMoves.set(row.pokemonId, new Set());
      pokemonMoves.get(row.pokemonId)!.add(row.moveName);
    }
    moveFilterIds = new Set<string>();
    for (const [pid, mset] of pokemonMoves) {
      if (moveNames.every(m => mset.has(m))) moveFilterIds.add(pid);
    }
    // Also include base species forms (e.g., if rotomwash learns a move, include rotom)
    // We need to expand: if any form of a base species matches, include all forms
    if (moveFilterIds.size > 0) {
      const relatedRows = await db
        .select({ id: pokemon.id, baseSpecies: pokemon.baseSpecies })
        .from(pokemon)
        .where(inArray(pokemon.id, Array.from(moveFilterIds)));
      for (const row of relatedRows) {
        if (row.baseSpecies) {
          moveFilterIds.add(row.baseSpecies.toLowerCase().replace(/[^a-z0-9]/g, ''));
        }
      }
    }
  }

  // Match by display name OR canonical id, so callers can pass either
  // "Gardevoir-Mega" or the storage-form id "gardevoirmega".
  const queryId = query ? query.toLowerCase().replace(/[^a-z0-9]/g, '') : null;
  const queryCondition = query
    ? (queryId ? or(ilike(pokemon.name, `%${query}%`), eq(pokemon.id, queryId)) : ilike(pokemon.name, `%${query}%`))
    : null;

  if (formatId) {
    // Join with pokemon_formats to filter by format
    const conditions = [
      eq(pokemonFormats.formatId, formatId),
      eq(pokemonFormats.isBanned, false),
    ];
    if (queryCondition) conditions.push(queryCondition);
    if (type) conditions.push(sql`${type} = ANY(${pokemon.types})`);
    if (moveFilterIds) conditions.push(inArray(pokemon.id, Array.from(moveFilterIds)));

    return db
      .select({
        id: pokemon.id,
        name: pokemon.name,
        dexNum: pokemon.dexNum,
        types: pokemon.types,
        baseStats: pokemon.baseStats,
        abilities: pokemon.abilities,
        heightm: pokemon.heightm,
        weightkg: pokemon.weightkg,
        tier: pokemon.tier,
        tags: pokemon.tags,
        otherFormes: pokemon.otherFormes,
        baseSpecies: pokemon.baseSpecies,
        spriteId: pokemon.spriteId,
        isRestricted: pokemonFormats.isRestricted,
      })
      .from(pokemon)
      .innerJoin(pokemonFormats, eq(pokemon.id, pokemonFormats.pokemonId))
      .where(and(...conditions))
      // Base forms first (no baseSpecies = base form), then by dex number, then shorter ID
      .orderBy(sql`CASE WHEN ${pokemon.baseSpecies} IS NULL THEN 0 ELSE 1 END`, pokemon.dexNum, sql`length(${pokemon.id})`)
      .limit(limit);
  }

  // No format filter — return all Pokemon
  const conditions = [];
  if (queryCondition) conditions.push(queryCondition);
  if (type) conditions.push(sql`${type} = ANY(${pokemon.types})`);
  if (moveFilterIds) conditions.push(inArray(pokemon.id, Array.from(moveFilterIds)));

  return db
    .select()
    .from(pokemon)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    // Base forms first (no baseSpecies), then by dex number, then shorter ID
    .orderBy(sql`CASE WHEN ${pokemon.baseSpecies} IS NULL THEN 0 ELSE 1 END`, pokemon.dexNum, sql`length(${pokemon.id})`)
    .limit(limit);
}

export async function getPokemonById(id: string) {
  const result = await db.select().from(pokemon).where(eq(pokemon.id, id)).limit(1);
  return result[0] || null;
}

// Some Pokemon have learnsets stored under a different ID than their species ID
const LEARNSET_ALIASES: Record<string, string> = {
  floette: 'floetteeternal',
  floettemega: 'floetteeternal',
};

export async function getLearnsetForPokemon(pokemonId: string) {
  // Include moves for this specific Pokemon + its base species only.
  // Champions learnsets have per-form data, so we must NOT merge sibling forms.
  // e.g. Rotom-Wash gets: its own moves + base Rotom's moves (NOT Rotom-Heat's Overheat).
  // But base Rotom gets: its own moves + ALL forms' moves (so base form shows everything).
  const ids: string[] = [pokemonId];

  // Add known aliases where learnset data is stored under a different ID
  const alias = LEARNSET_ALIASES[pokemonId];
  if (alias && !ids.includes(alias)) ids.push(alias);

  // Check if this Pokemon has a base species (i.e., it's a form)
  const selfRow = await db
    .select({ baseSpecies: pokemon.baseSpecies })
    .from(pokemon)
    .where(eq(pokemon.id, pokemonId))
    .limit(1);

  if (selfRow.length > 0 && selfRow[0].baseSpecies) {
    // This is a form — also include the base species' moves
    const baseId = selfRow[0].baseSpecies.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (baseId !== pokemonId && !ids.includes(baseId)) {
      ids.push(baseId);
    }
  } else {
    // This IS a base form — also include all alternate forms' moves
    // so base Rotom shows Hydro Pump, Overheat, etc.
    const formRows = await db
      .select({ id: pokemon.id })
      .from(pokemon)
      .where(eq(sql`lower(replace(${pokemon.baseSpecies}, ' ', ''))`, pokemonId));
    for (const r of formRows) {
      if (!ids.includes(r.id)) ids.push(r.id);
    }
  }

  return db
    .selectDistinctOn([moves.id], {
      moveId: learnsets.moveId,
      learnMethod: learnsets.learnMethod,
      name: moves.name,
      type: moves.type,
      category: moves.category,
      basePower: moves.basePower,
      accuracy: moves.accuracy,
      pp: moves.pp,
      priority: moves.priority,
      target: moves.target,
      description: moves.description,
    })
    .from(learnsets)
    .innerJoin(moves, eq(learnsets.moveId, moves.id))
    .where(inArray(learnsets.pokemonId, ids))
    .orderBy(moves.id, moves.name);
}

export async function searchMoves(query?: string, type?: string, category?: string, limit = 100) {
  const conditions = [];
  if (query) conditions.push(ilike(moves.name, `%${query}%`));
  if (type) conditions.push(eq(moves.type, type));
  if (category) conditions.push(eq(moves.category, category));

  return db
    .select()
    .from(moves)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(moves.name)
    .limit(limit);
}

export async function searchItems(query?: string, vgcOnly = false, limit = 100) {
  const conditions = [];
  if (query) conditions.push(ilike(items.name, `%${query}%`));
  if (vgcOnly) conditions.push(eq(items.isVgcRelevant, true));

  return db
    .select()
    .from(items)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(items.name)
    .limit(limit);
}

export async function getAllNatures() {
  return db.select().from(natures).orderBy(natures.name);
}

export async function getTypeChart() {
  return db.select().from(typeChart);
}

export async function getAllFormats() {
  return db.select().from(formats).orderBy(asc(formats.sortOrder));
}
