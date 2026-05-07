import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teams, pokemon, usageStats } from '@/lib/db/schema';
import { sql, desc } from 'drizzle-orm';

const ADMIN_KEY = process.env.ADMIN_KEY || 'champteams-admin-2026';

export function checkAdminAuth(request: NextRequest): NextResponse | null {
  const key = request.nextUrl.searchParams.get('key') || request.headers.get('x-admin-key');
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized. Pass ?key=YOUR_ADMIN_KEY' }, { status: 401 });
  }
  return null;
}

/**
 * GET /api/health?key=ADMIN_KEY
 * Returns system health info. Requires admin key.
 */
export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const start = Date.now();

  try {
    // DB health + table counts (single query)
    const [counts] = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM pokemon) as pokemon_count,
        (SELECT COUNT(*) FROM teams) as team_count,
        (SELECT COUNT(*) FROM moves) as move_count,
        (SELECT COUNT(*) FROM usage_stats) as usage_count,
        (SELECT MAX(updated_at) FROM usage_stats) as usage_last_updated
    `);

    // Memory usage
    const mem = process.memoryUsage();

    return NextResponse.json({
      ok: true,
      ts: new Date().toISOString(),
      dbLatencyMs: Date.now() - start,
      db: {
        pokemon: Number(counts.pokemon_count),
        teams: Number(counts.team_count),
        moves: Number(counts.move_count),
        usageStats: Number(counts.usage_count),
        usageLastUpdated: counts.usage_last_updated,
      },
      memory: {
        rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(mem.external / 1024 / 1024)}MB`,
      },
      uptime: `${Math.round(process.uptime())}s`,
      nodeVersion: process.version,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: e instanceof Error ? e.message : 'Unknown error',
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      },
    }, { status: 500 });
  }
}
