import { NextRequest, NextResponse } from 'next/server';
import { getLearnsetForPokemon } from '@/lib/pokemon/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const learnset = await getLearnsetForPokemon(id);
  return NextResponse.json(learnset, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  });
}
