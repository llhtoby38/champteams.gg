import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { tierlistEntries, pokemon, usageStats, moves as movesTable, pokemonFormats } from '@/lib/db/schema';
import { eq, desc, sql, inArray, and } from 'drizzle-orm';

const FORMULA = 'Meta score = 50% log-scaled tournament usage + 50% win rate score. Usage is log-scaled so niche high-winrate Pokemon are not buried by raw popularity. Win rate is centered at 48% (accounting for top Pokemon facing each other). Based entirely on Limitless VGC tournament results (50+ player events since Champions launch).';

function normalizeMoveName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const getTierListPayload = unstable_cache(
  async () => {
    return await buildTierListPayload();
  },
  ['tier-list-payload-v1'],
  { revalidate: 3600, tags: ['pipeline-snapshot', 'tier-list'] },
);

export async function GET(_request: NextRequest) {
  const payload = await getTierListPayload();
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
  });
}

async function buildTierListPayload() {
  // Latest snapshot
  const latest = await db
    .select({ snapshotDate: tierlistEntries.snapshotDate })
    .from(tierlistEntries)
    .orderBy(desc(tierlistEntries.snapshotDate))
    .limit(1);

  if (!latest.length) {
    return { tiers: [], snapshotDate: null, formula: FORMULA, dataRange: null };
  }

  const snapshotDate = latest[0].snapshotDate;

  // Get date range from tournament_entries for display
  const dateRange = await db.execute(
    sql`SELECT MIN(tournament_date) as earliest, MAX(tournament_date) as latest, COUNT(DISTINCT tournament_id) as tournament_count, COUNT(*) as team_count FROM tournament_entries`
  );
  const dataRange = (dateRange as unknown as { earliest: string; latest: string; tournament_count: string; team_count: string }[])?.[0];

  const rows = await db
    .select({
      pokemonId: tierlistEntries.pokemonId,
      tier: tierlistEntries.tier,
      metaScore: tierlistEntries.metaScore,
      tournamentUsage: tierlistEntries.tournamentUsage,
      winRate: tierlistEntries.winRate,
      ladderUsage: tierlistEntries.ladderUsage,
      position: tierlistEntries.position,
      momentum: tierlistEntries.momentum,
      description: tierlistEntries.description,
      previousTier: tierlistEntries.previousTier,
      movementNote: tierlistEntries.movementNote,
      name: pokemon.name,
      types: pokemon.types,
      spriteId: pokemon.spriteId,
      baseStats: pokemon.baseStats,
      abilities: pokemon.abilities,
      moves: usageStats.moves,
      items: usageStats.items,
      usageAbilities: usageStats.abilities,
      spreads: usageStats.spreads,
      teammates: usageStats.teammates,
    })
    .from(tierlistEntries)
    .leftJoin(pokemon, eq(pokemon.id, tierlistEntries.pokemonId))
    .leftJoin(
      usageStats,
      sql`${usageStats.pokemonId} = ${tierlistEntries.pokemonId}
          AND ${usageStats.id} = (
            SELECT id FROM usage_stats us2
            WHERE us2.pokemon_id = ${tierlistEntries.pokemonId}
            ORDER BY us2.month DESC LIMIT 1
          )`,
    )
    .where(eq(tierlistEntries.snapshotDate, snapshotDate))
    .orderBy(tierlistEntries.tier, desc(tierlistEntries.metaScore));

  // Enrich moves with type/category from moves table
  const moveNameSet = new Set<string>();
  for (const r of rows) {
    const list = (r.moves as { name: string }[] | null) || [];
    for (const m of list) if (m?.name) moveNameSet.add(m.name);
  }
  const moveIdList = Array.from(moveNameSet).map(normalizeMoveName);
  const moveMeta = moveIdList.length
    ? await db
        .select({ id: movesTable.id, name: movesTable.name, type: movesTable.type, category: movesTable.category })
        .from(movesTable)
        .where(inArray(movesTable.id, moveIdList))
    : [];
  const moveMetaByName = new Map<string, { type: string; category: string }>();
  for (const m of moveMeta) moveMetaByName.set(normalizeMoveName(m.name), { type: m.type, category: m.category });

  // Filter teammates to legal Pokemon only
  const legalNameRows = await db
    .select({ id: pokemon.id, name: pokemon.name })
    .from(pokemon)
    .innerJoin(pokemonFormats, and(
      eq(pokemonFormats.pokemonId, pokemon.id),
      eq(pokemonFormats.formatId, 'season-m1'),
      eq(pokemonFormats.isBanned, false),
    ));
  const legalNameKeys = new Set(legalNameRows.map(r => r.name.toLowerCase().replace(/[^a-z0-9]/g, '')));

  function filterTeammates(list: { name: string; percent: number }[] | null) {
    if (!list) return null;
    return list.filter(t => legalNameKeys.has(t.name.toLowerCase().replace(/[^a-z0-9]/g, '')));
  }

  function enrichMoves(list: { name: string; percent: number }[] | null) {
    if (!list) return null;
    return list.map(m => {
      const meta = moveMetaByName.get(normalizeMoveName(m.name));
      return { name: m.name, percent: m.percent, type: meta?.type || null, category: meta?.category || null };
    });
  }

  // Group by tier
  const tierOrder = ['S', 'A', 'B', 'C', 'D'];
  const grouped = tierOrder.map(t => ({
    tier: t,
    pokemon: rows
      .filter(r => r.tier === t && r.name)
      .map(r => ({
        id: r.pokemonId,
        name: r.name,
        types: r.types,
        spriteId: r.spriteId,
        baseStats: r.baseStats,
        abilities: r.abilities,
        metaScore: r.metaScore,
        tournamentUsage: r.tournamentUsage,
        winRate: r.winRate,
        ladderUsage: r.ladderUsage,
        momentum: r.momentum,
        description: r.description,
        previousTier: r.previousTier,
        movementNote: r.movementNote,
        moves: enrichMoves(r.moves as { name: string; percent: number }[] | null),
        items: r.items,
        usageAbilities: r.usageAbilities,
        spreads: r.spreads,
        teammates: filterTeammates(r.teammates as { name: string; percent: number }[] | null),
      })),
  }));

  return {
    tiers: grouped, snapshotDate, formula: FORMULA,
    dataRange: dataRange ? {
      earliest: dataRange.earliest,
      latest: dataRange.latest,
      tournamentCount: parseInt(dataRange.tournament_count) || 0,
      teamCount: parseInt(dataRange.team_count) || 0,
    } : null,
  };
}
