import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { defaultSets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const rows = await db
    .select()
    .from(defaultSets)
    .where(eq(defaultSets.pokemonId, id))
    .limit(1);

  if (!rows.length) {
    return NextResponse.json(null, { status: 404 });
  }

  const row = rows[0];
  return NextResponse.json({
    item: row.item,
    ability: row.ability,
    moves: row.moves,
    nature: row.nature,
    evs: row.evs as Record<string, number>,
    role: row.role,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
