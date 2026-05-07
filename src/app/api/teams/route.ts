import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teams } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { z } from 'zod/v4';

const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  format: z.string().default('season-m1'),
  pokemon: z.array(z.any()).max(6).default([]),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  metaThreats: z.array(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ teams: [], total: 0, page: 1, totalPages: 1, hasMore: false }, { status: 200 });
  }

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  const where = eq(teams.userId, userId as unknown as string);

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: teams.id,
        name: teams.name,
        format: teams.format,
        pokemonSets: teams.pokemonSets,
        isPublic: teams.isPublic,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        tags: teams.tags,
      })
      .from(teams)
      .where(where)
      .orderBy(desc(teams.updatedAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(teams).where(where),
  ]);

  const total = countRows[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return NextResponse.json({
    teams: rows,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  }, {
    headers: { 'Cache-Control': 'private, no-cache' },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createTeamSchema.safeParse(body);
  const userId = request.headers.get('x-user-id');

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const result = await db
    .insert(teams)
    .values({
      name: parsed.data.name,
      description: parsed.data.description,
      format: parsed.data.format,
      pokemonSets: parsed.data.pokemon,
      metaThreats: parsed.data.metaThreats ?? null,
      isPublic: parsed.data.isPublic,
      tags: parsed.data.tags ?? [],
      userId: userId as unknown as string ?? undefined,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
