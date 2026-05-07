import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { templateVotes } from '@/lib/db/schema';
import { and, eq, inArray, sql } from 'drizzle-orm';

// GET /api/templates/votes?ids=id1,id2,...
// Returns vote scores and (if x-user-id header) the user's own votes
export async function GET(request: NextRequest) {
  const ids = (request.nextUrl.searchParams.get('ids') || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (ids.length === 0) return NextResponse.json({});

  const userId = request.headers.get('x-user-id') || '';

  const rows = await db
    .select({
      templateId: templateVotes.templateId,
      score: sql<number>`SUM(${templateVotes.value})::int`,
    })
    .from(templateVotes)
    .where(inArray(templateVotes.templateId, ids))
    .groupBy(templateVotes.templateId);

  const scores: Record<string, number> = {};
  for (const r of rows) scores[r.templateId] = r.score;

  let userVotes: Record<string, number> = {};
  if (userId) {
    const uvRows = await db
      .select({ templateId: templateVotes.templateId, value: templateVotes.value })
      .from(templateVotes)
      .where(
        and(
          inArray(templateVotes.templateId, ids),
          eq(templateVotes.userId, userId as unknown as string),
        ),
      );
    for (const r of uvRows) userVotes[r.templateId] = r.value;
  }

  const result: Record<string, { score: number; userVote: number }> = {};
  for (const id of ids) {
    result[id] = { score: scores[id] ?? 0, userVote: userVotes[id] ?? 0 };
  }
  return NextResponse.json(result);
}
