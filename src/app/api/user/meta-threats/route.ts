import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/user/meta-threats
 * Returns the user's saved meta threat list.
 * Requires x-user-id header.
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const result = await db.select({ metaThreats: users.metaThreats })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json(null);
  }

  return NextResponse.json(result[0].metaThreats ?? null);
}

/**
 * PUT /api/user/meta-threats
 * Saves the user's meta threat list.
 * Requires x-user-id header.
 */
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Body must be a JSON array' }, { status: 400 });
  }

  await db.update(users)
    .set({ metaThreats: body, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
