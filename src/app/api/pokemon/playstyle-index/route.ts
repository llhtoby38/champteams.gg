import { NextRequest, NextResponse } from 'next/server';
import { buildPlaystyleIndex } from '@/lib/pokemon/playstyle-index';

// In-memory cache keyed by formatId. Invalidated on server restart.
const cache = new Map<string, Record<string, string[]>>();

export async function GET(request: NextRequest) {
  const formatId = request.nextUrl.searchParams.get('format') || 'season-m1';
  if (!cache.has(formatId)) {
    cache.set(formatId, await buildPlaystyleIndex(formatId));
  }
  return NextResponse.json(cache.get(formatId), {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  });
}
