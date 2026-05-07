import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { defaultSets, pokemon, tierlistEntries } from '@/lib/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import type { MetaThreat } from '@/types/calc';

/**
 * Canonical default meta threat list.
 *
 * Built by joining the latest tier list (tiers S–B, in order) with each
 * Pokemon's stored tournament `default_sets` row. Response shape:
 *
 *   { version: string, threats: MetaThreat[] }
 *
 * `version` is a content hash — clients use it to detect whether the list
 * has drifted since their last sync, without comparing full bodies.
 *
 * Aggressively cached at the edge (s-maxage=3600) since tournament data
 * only rolls over when the pipeline runs.
 */

const DEFAULT_TIERS = ['S', 'A', 'B'] as const;

export async function GET() {
  const latest = await db
    .select({ snapshotDate: tierlistEntries.snapshotDate })
    .from(tierlistEntries)
    .orderBy(desc(tierlistEntries.snapshotDate))
    .limit(1);

  if (!latest.length) {
    return NextResponse.json({ version: 'empty', threats: [] });
  }

  const snapshotDate = latest[0].snapshotDate;

  const entries = await db
    .select({
      pokemonId: tierlistEntries.pokemonId,
      tier: tierlistEntries.tier,
      metaScore: tierlistEntries.metaScore,
      position: tierlistEntries.position,
    })
    .from(tierlistEntries)
    .where(eq(tierlistEntries.snapshotDate, snapshotDate));

  const ranked = entries
    .filter(e => DEFAULT_TIERS.includes(e.tier as (typeof DEFAULT_TIERS)[number]))
    .sort((a, b) => {
      const ta = DEFAULT_TIERS.indexOf(a.tier as (typeof DEFAULT_TIERS)[number]);
      const tb = DEFAULT_TIERS.indexOf(b.tier as (typeof DEFAULT_TIERS)[number]);
      if (ta !== tb) return ta - tb;
      return b.metaScore - a.metaScore;
    });

  if (ranked.length === 0) {
    return NextResponse.json({ version: 'empty', threats: [] });
  }

  const ids = ranked.map(r => r.pokemonId);
  const [setRows, nameRows] = await Promise.all([
    db.select().from(defaultSets).where(inArray(defaultSets.pokemonId, ids)),
    db.select({ id: pokemon.id, name: pokemon.name }).from(pokemon).where(inArray(pokemon.id, ids)),
  ]);

  const setsById = new Map(setRows.map(r => [r.pokemonId, r]));
  const nameById = new Map(nameRows.map(r => [r.id, r.name]));

  const threats: MetaThreat[] = [];
  for (const entry of ranked) {
    const ds = setsById.get(entry.pokemonId);
    const name = nameById.get(entry.pokemonId);
    if (!ds || !name) continue;
    threats.push({
      id: `default-${entry.pokemonId}`,
      species: name,
      item: ds.item,
      ability: ds.ability,
      nature: ds.nature,
      evs: ds.evs as MetaThreat['evs'],
      moves: (ds.moves as string[]).slice(0, 4),
      role: ds.role || undefined,
    });
  }

  const version = createHash('sha1')
    .update(JSON.stringify(threats.map(t => [t.id, t.species, t.item, t.ability, t.nature, t.evs, t.moves])))
    .digest('hex')
    .slice(0, 12);

  return NextResponse.json(
    { version, threats, snapshotDate },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    },
  );
}
