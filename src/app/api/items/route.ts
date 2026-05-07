import { NextRequest, NextResponse } from 'next/server';
import { searchItems } from '@/lib/pokemon/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get('q') || undefined;
  const vgcOnly = searchParams.get('vgc') === 'true';
  const limit = parseInt(searchParams.get('limit') || '100', 10);

  const results = await searchItems(query, vgcOnly, Math.min(limit, 500));
  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  });
}
