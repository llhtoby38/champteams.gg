import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formats } from '@/lib/db/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  const result = await db.select().from(formats).orderBy(asc(formats.sortOrder));
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
  });
}
