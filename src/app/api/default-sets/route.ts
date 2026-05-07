import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { defaultSets, pokemon, usageStats } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';

// Returns a map of { [pokemonId]: DefaultSet } where DefaultSet also includes
// an `itemPool` (top items by usage %) so UIs that display multi-Pokemon
// cores can pick non-conflicting items for Item Clause (no duplicate held
// items in a legal VGC team).
export async function GET() {
  const [rows, usageRows] = await Promise.all([
    db
      .select({
        pokemonId: defaultSets.pokemonId,
        item: defaultSets.item,
        ability: defaultSets.ability,
        moves: defaultSets.moves,
        nature: defaultSets.nature,
        evs: defaultSets.evs,
        role: defaultSets.role,
        name: pokemon.name,
      })
      .from(defaultSets)
      .leftJoin(pokemon, eq(pokemon.id, defaultSets.pokemonId)),
    db
      .select({ pokemonId: usageStats.pokemonId, items: usageStats.items, month: usageStats.month })
      .from(usageStats)
      .orderBy(desc(usageStats.month)),
  ]);

  // Keep only the most-recent month per Pokemon (rows come back sorted desc by month).
  const itemPools = new Map<string, { name: string; percent: number }[]>();
  for (const u of usageRows) {
    if (itemPools.has(u.pokemonId)) continue;
    itemPools.set(u.pokemonId, (u.items as { name: string; percent: number }[]) || []);
  }

  const map: Record<string, {
    name: string;
    item: string;
    itemPool: { name: string; percent: number }[];
    ability: string;
    moves: string[];
    nature: string;
    evs: Record<string, number>;
    role: string | null;
  }> = {};

  for (const row of rows) {
    map[row.pokemonId] = {
      name: row.name ?? row.pokemonId,
      item: row.item,
      itemPool: itemPools.get(row.pokemonId) || [],
      ability: row.ability,
      moves: row.moves,
      nature: row.nature,
      evs: row.evs as Record<string, number>,
      role: row.role,
    };
  }

  return NextResponse.json(map, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
