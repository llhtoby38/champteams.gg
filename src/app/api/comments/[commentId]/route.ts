import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { comments } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

// DELETE /api/comments/[commentId] — soft delete (only own comments)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ commentId: string }> },
) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { commentId } = await params;

  const result = await db
    .update(comments)
    .set({ isDeleted: true, body: '[deleted]', updatedAt: new Date() })
    .where(and(eq(comments.id, commentId), eq(comments.userId, userId as unknown as string)))
    .returning({ id: comments.id });

  if (result.length === 0) {
    return NextResponse.json({ error: 'Not found or not authorized' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
