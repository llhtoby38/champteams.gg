import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  const cleanUsername = username.toLowerCase().trim();

  const result = await db.select().from(users).where(eq(users.email, cleanUsername)).limit(1);
  if (result.length === 0) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const user = result[0];
  if (!user.passwordHash) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  return NextResponse.json({
    userId: user.id,
    username: user.displayName,
  });
}
