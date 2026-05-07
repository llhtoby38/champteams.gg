import { NextRequest, NextResponse } from 'next/server';
import { searchPokemon } from '@/lib/pokemon/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q') || undefined;
  const type = searchParams.get('type') || undefined;
  const format = searchParams.get('format') || undefined;
  const limit = parseInt(searchParams.get('limit') || '2000', 10);
  const movesParam = searchParams.get('moves') || undefined;
  const moveNames = movesParam ? movesParam.split(',').map(m => m.trim()).filter(Boolean) : undefined;

  const results = await searchPokemon(query, type, limit, format, moveNames);
  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  });
}
