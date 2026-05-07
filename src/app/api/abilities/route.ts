import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { abilities } from '@/lib/db/schema';
import { inArray, asc } from 'drizzle-orm';

function normalizeId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function GET(request: NextRequest) {
  const namesParam = request.nextUrl.searchParams.get('names') || '';
  const listAll = request.nextUrl.searchParams.get('all') === 'true';

  // List all abilities with descriptions
  if (listAll) {
    const rows = await db
      .select({ id: abilities.id, name: abilities.name, description: abilities.description, rating: abilities.rating })
      .from(abilities)
      .orderBy(asc(abilities.name));
    return NextResponse.json(rows, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    });
  }

  if (!namesParam.trim()) return NextResponse.json({});

  const names = namesParam.split(',').map(n => n.trim()).filter(Boolean);
  const ids = names.map(normalizeId);

  const rows = await db
    .select({ id: abilities.id, name: abilities.name, description: abilities.description })
    .from(abilities)
    .where(inArray(abilities.id, ids));

  // Return a map of ability name → description
  const result: Record<string, string> = {};
  for (const row of rows) {
    if (row.name && row.description) result[row.name] = row.description;
  }
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  });
}
