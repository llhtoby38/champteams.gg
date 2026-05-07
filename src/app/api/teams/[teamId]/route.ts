import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teams, users, votes } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const userId = request.headers.get('x-user-id') || '';

  const voteScore = sql<number>`COALESCE((SELECT SUM(v.value) FROM votes v WHERE v.team_id = ${teams.id}), 0)`;
  const userVote = userId
    ? sql<number>`COALESCE((SELECT v.value FROM votes v WHERE v.team_id = ${teams.id} AND v.user_id = ${userId}::uuid), 0)`
    : sql<number>`0`;

  const result = await db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      format: teams.format,
      pokemonSets: teams.pokemonSets,
      metaThreats: teams.metaThreats,
      isPublic: teams.isPublic,
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt,
      authorName: sql<string | null>`COALESCE(${teams.author}, ${users.displayName})`,
      authorId: teams.userId,
      source: teams.source,
      tags: teams.tags,
      voteScore,
      userVote,
    })
    .from(teams)
    .leftJoin(users, eq(teams.userId, users.id))
    .where(eq(teams.id, teamId))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const body = await request.json();

  const result = await db
    .update(teams)
    .set({
      ...body,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only allow deleting teams you own
  const existing = await db
    .select({ userId: teams.userId })
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  if (existing[0].userId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.delete(teams).where(eq(teams.id, teamId));
  return NextResponse.json({ ok: true });
}
