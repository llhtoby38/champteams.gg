import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templateVotes, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod/v4';

const voteSchema = z.object({ value: z.literal(1).or(z.literal(-1)) });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { templateId } = await params;

  // Ensure the user exists in the users table (anonymous sessions have a UUID but no DB record)
  await db.insert(users).values({ id: userId as string }).onConflictDoNothing();

  const body = await request.json();
  const parsed = voteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid vote value' }, { status: 400 });
  }

  const existing = await db
    .select()
    .from(templateVotes)
    .where(and(eq(templateVotes.templateId, templateId), eq(templateVotes.userId, userId)))
    .limit(1);

  // Toggle off if same value
  if (existing.length > 0 && existing[0].value === parsed.data.value) {
    await db.delete(templateVotes).where(
      and(eq(templateVotes.templateId, templateId), eq(templateVotes.userId, userId)),
    );
    return NextResponse.json({ removed: true });
  }

  await db
    .insert(templateVotes)
    .values({ templateId, userId, value: parsed.data.value })
    .onConflictDoUpdate({
      target: [templateVotes.templateId, templateVotes.userId],
      set: { value: parsed.data.value },
    });

  return NextResponse.json({ ok: true });
}
