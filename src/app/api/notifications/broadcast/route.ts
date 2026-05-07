import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications, users } from '@/lib/db/schema';
import { z } from 'zod/v4';

const schema = z.object({
  type: z.enum(['announcement', 'tier-list', 'follow-cta']),
  title: z.string().min(1).max(200),
  body: z.string().max(1000).optional(),
  link: z.string().max(500).optional(),
});

// POST /api/notifications/broadcast
// Sends a notification to every registered user. Gated by REVALIDATE_SECRET
// so only the operator (and the pipeline / scripts) can fan it out.
export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const allUsers = await db.select({ id: users.id }).from(users);
  if (allUsers.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  const rows = allUsers.map(u => ({
    userId: u.id,
    type: parsed.data.type,
    title: parsed.data.title,
    body: parsed.data.body ?? null,
    link: parsed.data.link ?? null,
  }));

  // Insert in batches to keep individual statements small (1000 rows / batch).
  for (let i = 0; i < rows.length; i += 1000) {
    await db.insert(notifications).values(rows.slice(i, i + 1000));
  }

  return NextResponse.json({ ok: true, sent: rows.length });
}
