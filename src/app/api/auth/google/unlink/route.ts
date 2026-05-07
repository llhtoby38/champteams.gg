import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/auth/google/unlink
 * Removes Google link from user account.
 * Requires the user to have a password set (so they can still log in).
 */
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const user = await db.select({
    passwordHash: users.passwordHash,
    googleId: users.googleId,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (user.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (!user[0].googleId) {
    return NextResponse.json({ error: 'No Google account linked' }, { status: 400 });
  }

  if (!user[0].passwordHash) {
    return NextResponse.json({ error: 'Set a password before unlinking Google (otherwise you cannot log in)' }, { status: 400 });
  }

  await db.update(users)
    .set({ googleId: null, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
