import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { checkAdminAuth } from '../route';

/**
 * GET /api/health/dashboard?key=ADMIN_KEY
 * Returns an HTML dashboard showing system health, memory, and endpoint stats.
 * Requires admin key.
 */
export async function GET(request: NextRequest) {
  const authError = checkAdminAuth(request);
  if (authError) return authError;
  const start = Date.now();

  let dbInfo = '';
  try {
    const [counts] = await db.execute(sql`
      SELECT
        (SELECT COUNT(*) FROM pokemon) as pokemon_count,
        (SELECT COUNT(*) FROM teams) as team_count,
        (SELECT COUNT(*) FROM teams WHERE is_public = true) as public_teams,
        (SELECT COUNT(*) FROM moves) as move_count,
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM usage_stats) as usage_count,
        (SELECT MAX(updated_at) FROM usage_stats) as usage_updated,
        (SELECT COUNT(*) FROM votes) as vote_count,
        (SELECT COUNT(*) FROM comments) as comment_count
    `);
    const latency = Date.now() - start;

    dbInfo = `
      <div class="card">
        <h2>Database</h2>
        <div class="stat ok">Connected <span class="dim">(${latency}ms)</span></div>
        <table>
          <tr><td>Pokemon</td><td>${counts.pokemon_count}</td></tr>
          <tr><td>Moves</td><td>${counts.move_count}</td></tr>
          <tr><td>Teams</td><td>${counts.team_count} <span class="dim">(${counts.public_teams} public)</span></td></tr>
          <tr><td>Users</td><td>${counts.user_count}</td></tr>
          <tr><td>Usage Stats</td><td>${counts.usage_count}</td></tr>
          <tr><td>Usage Updated</td><td>${counts.usage_updated || 'never'}</td></tr>
          <tr><td>Votes</td><td>${counts.vote_count}</td></tr>
          <tr><td>Comments</td><td>${counts.comment_count}</td></tr>
        </table>
      </div>`;
  } catch (e) {
    dbInfo = `<div class="card"><h2>Database</h2><div class="stat err">Error: ${e instanceof Error ? e.message : 'Unknown'}</div></div>`;
  }

  const mem = process.memoryUsage();
  const rss = Math.round(mem.rss / 1024 / 1024);
  const heapUsed = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotal = Math.round(mem.heapTotal / 1024 / 1024);
  const memPct = Math.round((rss / 512) * 100);
  const memColor = rss > 400 ? '#c0392b' : rss > 300 ? '#d4a017' : '#27ae60';

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ChampTeams Health</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, system-ui, sans-serif; background: #0f0f1a; color: #e0e0e0; padding: 20px; }
  h1 { color: #d4a017; margin-bottom: 20px; font-size: 1.5rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
  .card { background: #1a1a2e; border: 1px solid #2a2a3e; border-radius: 12px; padding: 16px; }
  .card h2 { color: #d4a017; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
  table { width: 100%; }
  td { padding: 4px 0; font-size: 0.85rem; }
  td:last-child { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
  .dim { color: #666; font-weight: 400; }
  .stat { padding: 8px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; }
  .ok { background: #27ae6020; color: #27ae60; }
  .err { background: #c0392b20; color: #c0392b; }
  .bar { height: 8px; border-radius: 4px; background: #2a2a3e; margin: 8px 0; }
  .bar-fill { height: 100%; border-radius: 4px; transition: width 0.3s; }
  .refresh { font-size: 0.75rem; color: #666; margin-top: 16px; }
</style></head>
<body>
  <h1>ChampTeams.gg — System Health</h1>
  <div class="grid">
    ${dbInfo}
    <div class="card">
      <h2>Memory</h2>
      <div class="stat" style="background:${memColor}20;color:${memColor}">RSS: ${rss}MB / 512MB (${memPct}%)</div>
      <div class="bar"><div class="bar-fill" style="width:${memPct}%;background:${memColor}"></div></div>
      <table>
        <tr><td>Heap Used</td><td>${heapUsed}MB</td></tr>
        <tr><td>Heap Total</td><td>${heapTotal}MB</td></tr>
        <tr><td>External</td><td>${Math.round(mem.external / 1024 / 1024)}MB</td></tr>
      </table>
    </div>
    <div class="card">
      <h2>Runtime</h2>
      <table>
        <tr><td>Uptime</td><td>${Math.round(process.uptime())}s</td></tr>
        <tr><td>Node</td><td>${process.version}</td></tr>
        <tr><td>Platform</td><td>${process.platform} ${process.arch}</td></tr>
        <tr><td>Time</td><td>${new Date().toISOString()}</td></tr>
      </table>
    </div>
    <div class="card">
      <h2>API Endpoints</h2>
      <table>
        <tr><td>/api/pokemon</td><td><a href="/api/pokemon?limit=1" style="color:#d4a017">test</a></td></tr>
        <tr><td>/api/teams</td><td><a href="/api/teams" style="color:#d4a017">test</a></td></tr>
        <tr><td>/api/usage</td><td><a href="/api/usage?top=5" style="color:#d4a017">test</a></td></tr>
        <tr><td>/api/calc/damage</td><td><span class="dim">POST only</span></td></tr>
        <tr><td>/api/health</td><td><a href="/api/health" style="color:#d4a017">JSON</a></td></tr>
      </table>
    </div>
  </div>
  <p class="refresh">Auto-refresh: <a href="" style="color:#d4a017">reload</a> | Usage stats update via manual seed script</p>
</body></html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
