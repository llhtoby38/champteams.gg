import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { pokemonPairStats, pokemon } from '@/lib/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

const FORMAT_ID = 'gen9championsvgc2026regma';
const MAX_LIMIT = 30;

interface Partner {
  pokemonId: string;
  name: string;
  spriteId: string | null;
  types: string[] | null;
  coOccurrencePct: number;
  winRateTogether: number | null;
  smogonTeammatePct: number | null;
  coCount: number;
  // 0-100 ranking score combining co-occurrence and (when present) win rate.
  score: number;
}

function normalizeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const getPartnersPayload = unstable_cache(
  async (anchors: string[], exclude: string[], limit: number) => buildPartnersPayload(anchors, exclude, limit),
  ['partners-payload-v1'],
  { revalidate: 3600, tags: ['pipeline-snapshot', 'partners'] },
);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  // `species` (repeatable) is the list of Pokemon already on the team — we
  // intersect partner lists across all anchors so the suggestions cover the
  // whole composition, not just the most recently added pick.
  const speciesParams = searchParams.getAll('species');
  const exclude = searchParams.getAll('exclude').map(normalizeId);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || '6', 10)));

  const anchors = [...new Set(speciesParams.map(normalizeId).filter(Boolean))].sort();
  if (anchors.length === 0) {
    return NextResponse.json({ partners: [], anchors: [] });
  }
  // Sort exclude too so cache keys are deterministic regardless of input order.
  const sortedExclude = [...new Set(exclude)].sort();

  const payload = await getPartnersPayload(anchors, sortedExclude, limit);
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300' },
  });
}

async function buildPartnersPayload(anchors: string[], exclude: string[], limit: number) {
  // Fetch all partner rows for each anchor in one indexed query.
  const rows = await db
    .select({
      primaryId: pokemonPairStats.primaryId,
      partnerId: pokemonPairStats.partnerId,
      partnerName: pokemonPairStats.partnerName,
      coCount: pokemonPairStats.coCount,
      coOccurrencePct: pokemonPairStats.coOccurrencePct,
      winRateTogether: pokemonPairStats.winRateTogether,
      smogonTeammatePct: pokemonPairStats.smogonTeammatePct,
    })
    .from(pokemonPairStats)
    .where(and(
      eq(pokemonPairStats.formatId, FORMAT_ID),
      inArray(pokemonPairStats.primaryId, anchors),
    ));

  if (rows.length === 0) return { partners: [], anchors };

  // Aggregate across anchors: a partner gets credit per anchor it pairs with.
  // Sum co_occurrence_pct (so a partner shared across multiple anchors scores
  // higher) and weighted-average WR.
  const agg = new Map<string, {
    partnerId: string;
    partnerName: string;
    coCountTotal: number;
    pctSum: number;
    pctAnchors: number;
    wrWeightedSum: number;
    wrWeight: number;
    smogonSum: number;
    smogonAnchors: number;
  }>();

  const excludeSet = new Set([...anchors, ...exclude]);
  for (const r of rows) {
    if (excludeSet.has(r.partnerId)) continue;
    const cur = agg.get(r.partnerId) ?? {
      partnerId: r.partnerId, partnerName: r.partnerName,
      coCountTotal: 0, pctSum: 0, pctAnchors: 0,
      wrWeightedSum: 0, wrWeight: 0, smogonSum: 0, smogonAnchors: 0,
    };
    cur.coCountTotal += r.coCount;
    cur.pctSum += r.coOccurrencePct;
    cur.pctAnchors++;
    if (r.winRateTogether != null) {
      cur.wrWeightedSum += r.winRateTogether * r.coCount;
      cur.wrWeight += r.coCount;
    }
    if (r.smogonTeammatePct != null) {
      cur.smogonSum += r.smogonTeammatePct;
      cur.smogonAnchors++;
    }
    agg.set(r.partnerId, cur);
  }

  if (agg.size === 0) return { partners: [], anchors };

  // Fetch sprite + types for the candidates we're about to return.
  const candidateIds = Array.from(agg.keys());
  const pokemonRows = await db
    .select({ id: pokemon.id, name: pokemon.name, spriteId: pokemon.spriteId, types: pokemon.types })
    .from(pokemon)
    .where(inArray(pokemon.id, candidateIds));
  const pokemonById = new Map(pokemonRows.map(p => [p.id, p]));

  // winRateTogether is stored as a percentage (0-100) by compute-pokemon-pairs.
  // Score = mean co-occurrence% + 0.5 * (WR - 50) bonus, so a 60% WR adds 5
  // and a 40% WR subtracts 5. WR can swing ±25 at the extremes.
  const partners: Partner[] = Array.from(agg.values()).map(p => {
    const meanPct = p.pctSum / p.pctAnchors;
    const wr = p.wrWeight > 0 ? p.wrWeightedSum / p.wrWeight : null;
    const wrBonus = wr != null ? 0.5 * (wr - 50) : 0;
    const score = Math.max(0, Math.min(100, meanPct + wrBonus));
    const poke = pokemonById.get(p.partnerId);
    return {
      pokemonId: p.partnerId,
      name: poke?.name ?? p.partnerName,
      spriteId: poke?.spriteId ?? null,
      types: poke?.types ?? null,
      coOccurrencePct: Math.round(meanPct * 10) / 10,
      winRateTogether: wr != null ? Math.round(wr * 10) / 10 : null,
      smogonTeammatePct: p.smogonAnchors > 0 ? Math.round((p.smogonSum / p.smogonAnchors) * 10) / 10 : null,
      coCount: p.coCountTotal,
      score: Math.round(score * 10) / 10,
    };
  });

  partners.sort((a, b) => b.score - a.score);
  return { partners: partners.slice(0, limit), anchors };
}
