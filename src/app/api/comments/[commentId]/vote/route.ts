import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments, commentVotes } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod/v4';

const voteSchema = z.object({ value: z.literal(1).or(z.literal(-1)) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { commentId } = await params;
  const body = await request.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(commentVotes)
    .where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.userId, userId as unknown as string)))
    .limit(1);

  let delta = 0;
  if (existing.length > 0 && existing[0].value === parsed.data.value) {
    // Toggle off
    await db.delete(commentVotes).where(
      and(eq(commentVotes.commentId, commentId), eq(commentVotes.userId, userId as unknown as string)),
    );
    delta = -parsed.data.value;
  } else {
    const prevValue = existing.length > 0 ? existing[0].value : 0;
    await db
      .insert(commentVotes)
      .values({ commentId, userId: userId as unknown as string, value: parsed.data.value })
      .onConflictDoUpdate({
        target: [commentVotes.commentId, commentVotes.userId],
        set: { value: parsed.data.value },
      });
    delta = parsed.data.value - prevValue;
  }

  // Update denormalized score
  await db
    .update(comments)
    .set({ score: sql`${comments.score} + ${delta}` })
    .where(eq(comments.id, commentId));

  const [updated] = await db
    .select({ score: comments.score })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  return NextResponse.json({ score: updated?.score ?? 0 });
}
