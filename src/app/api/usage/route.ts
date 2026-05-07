import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { usageStats } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { maybeRefreshUsageStats } from '@/lib/usage/smogon-fetcher';

/**
 * GET /api/usage?pokemon=incineroar
 * GET /api/usage?pokemon=incineroar&format=gen9championsvgc2026regma
 * GET /api/usage?top=20  (top N by usage %)
 *
 * Returns usage stats from Smogon: moves, items, abilities, spreads, teammates.
 * Triggers a background refresh from Smogon if cached data is older than 24h.
 * Users always get the cached data immediately — no waiting for the refresh.
 */
export async function GET(request: NextRequest) {
  // Fire-and-forget: check if data needs refreshing (non-blocking)
  maybeRefreshUsageStats(db).catch(() => {});

  const pokemonId = request.nextUrl.searchParams.get('pokemon');
  const formatId = request.nextUrl.searchParams.get('format');
  const top = parseInt(request.nextUrl.searchParams.get('top') || '0', 10);

  if (pokemonId) {
    const conditions = [eq(usageStats.pokemonId, pokemonId.toLowerCase().replace(/[^a-z0-9]/g, ''))];
    if (formatId) conditions.push(eq(usageStats.formatId, formatId));

    const result = await db.select()
      .from(usageStats)
      .where(and(...conditions))
      .orderBy(desc(usageStats.month))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(null);
    }
    return NextResponse.json(result[0], {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
    });
  }

  if (top > 0) {
    const conditions = formatId ? [eq(usageStats.formatId, formatId)] : [];
    const result = await db.select({
      pokemonId: usageStats.pokemonId,
      usagePercent: usageStats.usagePercent,
      moves: usageStats.moves,
      items: usageStats.items,
      abilities: usageStats.abilities,
      spreads: usageStats.spreads,
    })
      .from(usageStats)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(usageStats.usagePercent))
      .limit(top);

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
    });
  }

  return NextResponse.json({ error: 'Provide ?pokemon=name or ?top=N' }, { status: 400 });
}
