import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teams } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { teamId } = await params;
  const { isPublic } = await request.json();

  const result = await db
    .update(teams)
    .set({ isPublic: Boolean(isPublic), updatedAt: new Date() })
    .where(and(eq(teams.id, teamId), eq(teams.userId, userId)))
    .returning({ id: teams.id, isPublic: teams.isPublic });

  if (result.length === 0) {
    return NextResponse.json({ error: 'Team not found or not yours' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}
