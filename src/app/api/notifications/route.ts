import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { eq, desc, and, isNull, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ items: [], unreadCount: 0 }, { status: 200 });
  }

  // Most recent 30 notifications + unread count.
  const items = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(30);

  const unreadRow = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  const unreadCount = unreadRow[0]?.count ?? 0;

  return NextResponse.json({ items, unreadCount }, {
    headers: { 'Cache-Control': 'private, no-cache' },
  });
}
