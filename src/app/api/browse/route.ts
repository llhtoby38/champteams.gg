import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teams, users, votes, tierlistEntries } from '@/lib/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { computeTeamTags } from '@/lib/pokemon/team-tags';

// Compute effective tags for a team (merge stored + computed)
function effectiveTags(storedTags: string[] | null, pokemonSets: unknown[]): string[] {
  const sets = (pokemonSets || []) as { species?: string; ability?: string; item?: string; moves?: string[] }[];
  const computed = computeTeamTags(sets.map(p => ({
    species: p.species ?? '',
    ability: p.ability,
    item: p.item,
    moves: p.moves,
  })));
  return Array.from(new Set([...(storedTags ?? []), ...computed]));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(24, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
  const pokemon = searchParams.get('pokemon')?.toLowerCase().trim() || '';
  const tagsParam = searchParams.get('tags') || '';
  const filterTags = tagsParam ? tagsParam.split(',').map(t => t.trim()).filter(Boolean) : [];
  const sort = searchParams.get('sort') || 'top'; // 'top' | 'new' | 'meta'
  const userId = request.headers.get('x-user-id') || '';

  // Build base conditions (no tag filter in SQL — we compute tags in JS)
  const conditions = [eq(teams.isPublic, true)];

  if (pokemon) {
    conditions.push(
      sql`${teams.pokemonSets}::text ILIKE ${'%' + pokemon + '%'}`,
    );
  }

  const creatorOnly = searchParams.get('creatorOnly') === '1';
  const communityOnly = searchParams.get('communityOnly') === '1';
  const tournamentOnly = searchParams.get('tournamentOnly') === '1';
  if (creatorOnly) conditions.push(sql`(${teams.author} IS NOT NULL OR ${teams.source} IS NOT NULL)`);
  if (communityOnly) conditions.push(sql`(${teams.author} IS NULL AND ${teams.source} IS NULL)`);
  if (tournamentOnly) conditions.push(sql`${teams.source} = 'limitless-tournament'`);

  const where = and(...conditions);

  // Build vote score subquery
  const voteScore = sql<number>`COALESCE((
    SELECT SUM(v.value) FROM votes v WHERE v.team_id = ${teams.id}
  ), 0)`;

  const userVote = userId
    ? sql<number>`COALESCE((
        SELECT v.value FROM votes v WHERE v.team_id = ${teams.id} AND v.user_id = ${userId}::uuid
      ), 0)`
    : sql<number>`0`;

  const commentCount = sql<number>`(
    SELECT COUNT(*)::int FROM comments c WHERE c.team_id = ${teams.id} AND c.is_deleted = false
  )`;

  // Fetch all matching teams (no pagination yet — needed for tag filtering + availableTags)
  const allRows = await db
    .select({
      id: teams.id,
      name: teams.name,
      description: teams.description,
      format: teams.format,
      pokemonSets: teams.pokemonSets,
      isPublic: teams.isPublic,
      createdAt: teams.createdAt,
      updatedAt: teams.updatedAt,
      authorName: sql<string | null>`COALESCE(${teams.author}, ${users.displayName})`,
      authorId: teams.userId,
      source: teams.source,
      tags: teams.tags,
      voteScore,
      userVote,
      commentCount,
    })
    .from(teams)
    .leftJoin(users, eq(teams.userId, users.id))
    .where(where)
    .orderBy(
      sort === 'top' ? desc(voteScore) : desc(teams.createdAt),
      desc(teams.createdAt),
    );

  // Fetch meta scores once for computing team meta score
  const metaScoreRows = await db
    .select({ pokemonId: tierlistEntries.pokemonId, metaScore: tierlistEntries.metaScore })
    .from(tierlistEntries);
  const metaScoreMap = new Map(metaScoreRows.map(r => [r.pokemonId, r.metaScore]));

  function computeTeamMetaScore(pokemonSets: unknown[]): number {
    const sets = (pokemonSets || []) as { species?: string }[];
    if (!sets.length) return 0;
    const scores = sets
      .map(s => {
        const id = (s.species || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return metaScoreMap.get(id) ?? 0;
      });
    if (!scores.length) return 0;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  }

  function memberMetaScores(pokemonSets: unknown[]): { name: string; score: number | null }[] {
    const sets = (pokemonSets || []) as { species?: string }[];
    return sets.map(s => {
      const id = (s.species || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const sc = metaScoreMap.get(id);
      return { name: s.species || '', score: sc == null ? null : Math.round(sc * 10) / 10 };
    });
  }

  // Compute effective tags + meta score for every row
  const allTagsSet = new Set<string>();
  const rowsWithTags = allRows.map(row => {
    const effective = effectiveTags(row.tags, row.pokemonSets as unknown[]);
    effective.forEach(t => allTagsSet.add(t));
    const teamMetaScore = computeTeamMetaScore(row.pokemonSets as unknown[]);
    const memberScores = memberMetaScores(row.pokemonSets as unknown[]);
    return { ...row, tags: effective, teamMetaScore, memberScores };
  });

  // If sorting by meta score, re-sort here (JS-side since meta scores are computed)
  if (sort === 'meta') {
    rowsWithTags.sort((a, b) => {
      if (b.teamMetaScore !== a.teamMetaScore) return b.teamMetaScore - a.teamMetaScore;
      return Number(b.voteScore) - Number(a.voteScore);
    });
  }

  // Filter by tags (OR logic — team must have at least one of the selected tags)
  const filtered = filterTags.length > 0
    ? rowsWithTags.filter(row => filterTags.some(t => row.tags.includes(t)))
    : rowsWithTags;

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const rows = filtered.slice(offset, offset + limit);

  return NextResponse.json({
    teams: rows,
    total,
    page,
    totalPages,
    availableTags: Array.from(allTagsSet).sort(),
  }, {
    headers: {
      'Cache-Control': userId
        ? 'private, no-cache'
        : 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
