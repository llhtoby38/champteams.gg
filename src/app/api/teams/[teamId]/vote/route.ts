import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { votes, teams, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import { notifyUpvote } from '@/lib/notifications';

const voteSchema = z.object({ value: z.literal(1).or(z.literal(-1)) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { teamId } = await params;
  const body = await request.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 });
  }

  // Ensure the user exists in the users table (anonymous sessions have a UUID but no DB record)
  await db.insert(users).values({ id: userId as string }).onConflictDoNothing();

  // Verify team exists and is public
  const team = await db.select({ id: teams.id }).from(teams).where(eq(teams.id, teamId)).limit(1);
  if (team.length === 0) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }

  // Upsert vote (if same value exists, delete it — toggle off)
  const existing = await db
    .select()
    .from(votes)
    .where(and(eq(votes.teamId, teamId), eq(votes.userId, userId)))
    .limit(1);

  if (existing.length > 0 && existing[0].value === parsed.data.value) {
    // Toggle off
    await db.delete(votes).where(and(eq(votes.teamId, teamId), eq(votes.userId, userId)));
    return NextResponse.json({ removed: true });
  }

  await db
    .insert(votes)
    .values({ teamId, userId, value: parsed.data.value })
    .onConflictDoUpdate({
      target: [votes.teamId, votes.userId],
      set: { value: parsed.data.value },
    });

  // Only +1 generates a notification; downvotes stay quiet.
  if (parsed.data.value === 1) {
    notifyUpvote({ teamId, actorUserId: userId })
      .catch(err => console.warn('notifyUpvote failed', err));
  }

  return NextResponse.json({ ok: true });
}
