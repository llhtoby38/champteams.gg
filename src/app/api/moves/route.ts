import { NextRequest, NextResponse } from 'next/server';
import { searchMoves } from '@/lib/pokemon/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q') || undefined;
  const type = searchParams.get('type') || undefined;
  const category = searchParams.get('category') || undefined;
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const results = await searchMoves(query, type, category, Math.min(limit, 2000));
  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  });
}
