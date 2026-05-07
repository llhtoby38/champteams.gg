import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';

// POST /api/notifications/read
// Body: { ids?: string[] } — if omitted, marks all the user's unread as read.
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const ids: string[] | undefined = Array.isArray(body.ids) ? body.ids : undefined;

  const now = new Date();
  if (ids && ids.length > 0) {
    await db.update(notifications)
      .set({ readAt: now })
      .where(and(
        eq(notifications.userId, userId),
        inArray(notifications.id, ids),
      ));
  } else {
    await db.update(notifications)
      .set({ readAt: now })
      .where(and(
        eq(notifications.userId, userId),
        isNull(notifications.readAt),
      ));
  }

  return NextResponse.json({ ok: true });
}
