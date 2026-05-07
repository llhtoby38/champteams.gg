import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const { username, password, email } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }
  if (username.length < 3 || username.length > 30) {
    return NextResponse.json({ error: 'Username must be 3-30 characters' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const cleanUsername = username.toLowerCase().trim();

  // Check if username exists (email field stores the lowercase username)
  const existing = await db.select().from(users).where(eq(users.email, cleanUsername)).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
  }

  // If email provided, validate format
  if (email && typeof email === 'string' && email.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.insert(users).values({
    email: cleanUsername, // username stored in email field for login lookup
    displayName: username,
    passwordHash,
  }).returning();

  return NextResponse.json({
    userId: result[0].id,
    username: result[0].displayName,
  }, { status: 201 });
}
