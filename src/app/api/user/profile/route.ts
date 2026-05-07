import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/user/profile
 * Returns the user's profile info.
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const result = await db.select({
    id: users.id,
    email: users.email,
    displayName: users.displayName,
    googleId: users.googleId,
    hasPassword: users.passwordHash,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.id, userId)).limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const user = result[0];
  return NextResponse.json({
    id: user.id,
    username: user.email,
    displayName: user.displayName,
    hasGoogle: !!user.googleId,
    hasPassword: !!user.hasPassword,
    createdAt: user.createdAt,
  });
}

/**
 * PUT /api/user/profile
 * Updates username and/or password.
 * Body: { username?, password?, currentPassword? }
 */
export async function PUT(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user.length === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Update username
  if (body.username && typeof body.username === 'string') {
    const newUsername = body.username.trim();
    if (newUsername.length < 3 || newUsername.length > 30) {
      return NextResponse.json({ error: 'Username must be 3-30 characters' }, { status: 400 });
    }
    const cleanUsername = newUsername.toLowerCase();
    // Check uniqueness
    const existing = await db.select({ id: users.id }).from(users)
      .where(eq(users.email, cleanUsername)).limit(1);
    if (existing.length > 0 && existing[0].id !== userId) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    updates.email = cleanUsername;
    updates.displayName = newUsername;
  }

  // Update password
  if (body.password && typeof body.password === 'string') {
    if (body.password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    // If user already has a password, require current password
    if (user[0].passwordHash && body.currentPassword) {
      const valid = await bcrypt.compare(body.currentPassword, user[0].passwordHash);
      if (!valid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
    }
    updates.passwordHash = await bcrypt.hash(body.password, 10);
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  // Return updated profile
  const updated = await db.select({
    email: users.email,
    displayName: users.displayName,
  }).from(users).where(eq(users.id, userId)).limit(1);

  return NextResponse.json({
    username: updated[0]?.displayName || updated[0]?.email,
  });
}
