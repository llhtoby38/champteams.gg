import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { metaCores, pokemon, defaultSets } from '@/lib/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { generateCoreDescription, deriveCoreTags, type CoreSet } from '@/lib/pokemon/core-descriptions';

const p1 = alias(pokemon, 'p1');
const p2 = alias(pokemon, 'p2');
const p3 = alias(pokemon, 'p3');

const getCoresPayload = unstable_cache(
  async (limit: number) => buildCoresPayload(limit),
  ['cores-payload-v1'],
  { revalidate: 3600, tags: ['pipeline-snapshot', 'cores'] },
);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '30', 10)));
  const payload = await getCoresPayload(limit);
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
  });
}

async function buildCoresPayload(limit: number) {
  // Scale the diversity cap with the requested limit so a few dominant glue
  // pieces don't starve the list when the user asks for more cores.
  const maxAppearances = Math.max(3, Math.ceil(limit / 6));

  const latest = await db
    .select({ snapshotDate: metaCores.snapshotDate })
    .from(metaCores)
    .orderBy(desc(metaCores.snapshotDate))
    .limit(1);

  if (!latest.length) {
    return { cores: [], snapshotDate: null };
  }

  const snapshotDate = latest[0].snapshotDate;

  // Fetch a larger pool than `limit` so we can re-sort + apply diversity cap
  // without the DB-level order constraining us.
  const rows = await db
    .select({
      id: metaCores.id,
      pokemon1Id: metaCores.pokemon1Id,
      pokemon2Id: metaCores.pokemon2Id,
      pokemon3Id: metaCores.pokemon3Id,
      coreScore: metaCores.coreScore,
      synergyPercent: metaCores.synergyPercent,
      coOccurrence: metaCores.coOccurrence,
      avgMetaScore: metaCores.avgMetaScore,
      description: metaCores.description,
      tags: metaCores.tags,
      voteScore: metaCores.voteScore,
      p1Name: p1.name,
      p1Types: p1.types,
      p1Sprite: p1.spriteId,
      p2Name: p2.name,
      p2Types: p2.types,
      p2Sprite: p2.spriteId,
      p3Name: p3.name,
      p3Types: p3.types,
      p3Sprite: p3.spriteId,
    })
    .from(metaCores)
    .leftJoin(p1, eq(p1.id, metaCores.pokemon1Id))
    .leftJoin(p2, eq(p2.id, metaCores.pokemon2Id))
    .leftJoin(p3, eq(p3.id, metaCores.pokemon3Id))
    .where(eq(metaCores.snapshotDate, snapshotDate))
    .orderBy(desc(metaCores.coreScore))
    .limit(150);

  // Diversity pass: cap how many cores can contain the same Pokemon so the
  // list isn't swamped by a single meta glue piece. We walk in coreScore
  // order and skip any core that would push a member past the cap.
  const appearances = new Map<string, number>();
  const diversified: typeof rows = [];
  for (const r of rows) {
    const ids = [r.pokemon1Id, r.pokemon2Id, r.pokemon3Id].filter(Boolean) as string[];
    const blocked = ids.some(id => (appearances.get(id) || 0) >= maxAppearances);
    if (blocked) continue;
    for (const id of ids) appearances.set(id, (appearances.get(id) || 0) + 1);
    diversified.push(r);
    if (diversified.length >= limit) break;
  }

  // Fetch default_sets for every Pokemon in the visible cores so we can
  // regenerate descriptions on the fly. This keeps the narrative in sync
  // with code changes without needing a pipeline re-run / DB rewrite.
  const allIds = new Set<string>();
  for (const r of diversified) {
    allIds.add(r.pokemon1Id);
    allIds.add(r.pokemon2Id);
    if (r.pokemon3Id) allIds.add(r.pokemon3Id);
  }
  const setRows = allIds.size
    ? await db.select().from(defaultSets).where(inArray(defaultSets.pokemonId, Array.from(allIds)))
    : [];
  const setsById = new Map(setRows.map(r => [r.pokemonId, r]));

  const buildSet = (id: string | null, name: string | null): CoreSet | null => {
    if (!id || !name) return null;
    const ds = setsById.get(id);
    return {
      id,
      name,
      ability: ds?.ability || '',
      moves: (ds?.moves as string[] | undefined) || [],
    };
  };

  const cores = diversified.map(r => {
    const coreSets: CoreSet[] = [
      buildSet(r.pokemon1Id, r.p1Name),
      buildSet(r.pokemon2Id, r.p2Name),
      buildSet(r.pokemon3Id, r.p3Name),
    ].filter(Boolean) as CoreSet[];
    const liveDescription = generateCoreDescription(coreSets);
    const derivedTags = deriveCoreTags(coreSets);
    const mergedTags = Array.from(new Set([...(r.tags || []), ...derivedTags]));

    return {
      id: r.id,
      pokemon1: { id: r.pokemon1Id, name: r.p1Name, types: r.p1Types, spriteId: r.p1Sprite },
      pokemon2: { id: r.pokemon2Id, name: r.p2Name, types: r.p2Types, spriteId: r.p2Sprite },
      pokemon3: r.pokemon3Id ? { id: r.pokemon3Id, name: r.p3Name, types: r.p3Types, spriteId: r.p3Sprite } : null,
      coreScore: r.coreScore,
      synergyPercent: r.synergyPercent,
      coOccurrence: r.coOccurrence,
      avgMetaScore: r.avgMetaScore,
      description: liveDescription || r.description,
      tags: mergedTags,
      voteScore: r.voteScore ?? 0,
    };
  });

  return { cores, snapshotDate };
}
