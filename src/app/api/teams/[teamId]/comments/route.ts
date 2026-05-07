import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments, commentVotes, users } from '@/lib/db/schema';
import { eq, isNull, desc, and } from 'drizzle-orm';
import { z } from 'zod/v4';
import { notifyComment } from '@/lib/notifications';

const postSchema = z.object({
  body: z.string().min(1).max(2000),
  parentId: z.string().uuid().nullable().optional(),
});

// GET /api/teams/[teamId]/comments — fetch all comments (threaded)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const { teamId } = await params;
  const userId = request.headers.get('x-user-id') || '';

  // Fetch all non-deleted comments for this team, with author info
  const rows = await db
    .select({
      id: comments.id,
      teamId: comments.teamId,
      parentId: comments.parentId,
      body: comments.body,
      score: comments.score,
      isDeleted: comments.isDeleted,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      authorId: comments.userId,
      authorName: users.displayName,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.teamId, teamId))
    .orderBy(desc(comments.score), desc(comments.createdAt));

  // If user logged in, fetch their votes
  let userVotesMap: Record<string, number> = {};
  if (userId) {
    const userVotes = await db
      .select({ commentId: commentVotes.commentId, value: commentVotes.value })
      .from(commentVotes)
      .where(eq(commentVotes.userId, userId as unknown as string));
    userVotesMap = Object.fromEntries(userVotes.map(v => [v.commentId, v.value]));
  }

  const result = rows.map(r => ({
    ...r,
    body: r.isDeleted ? '[deleted]' : r.body,
    authorName: r.isDeleted ? null : r.authorName,
    userVote: userVotesMap[r.id] ?? 0,
  }));

  return NextResponse.json(result);
}

// POST /api/teams/[teamId]/comments — create a new comment
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
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const [comment] = await db
    .insert(comments)
    .values({
      teamId,
      userId: userId as unknown as string,
      parentId: parsed.data.parentId ?? null,
      body: parsed.data.body,
    })
    .returning();

  // Fire-and-forget: notification failure must not break the comment write.
  notifyComment({
    teamId,
    commentId: comment.id,
    parentCommentId: parsed.data.parentId ?? null,
    actorUserId: userId,
  }).catch(err => console.warn('notifyComment failed', err));

  return NextResponse.json(comment);
}
