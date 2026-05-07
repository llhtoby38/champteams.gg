import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { tournamentEntries, tierlistEntries, pokemon } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

function toBaseFormId(name: string): string {
  const id = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return id.replace(/mega$/, '').replace(/megax$/, '').replace(/megay$/, '');
}

function normalizeId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function inferTags(ids: string[]): string[] {
  const tags: string[] = [];
  if (ids.includes('tyranitar') && ids.includes('excadrill')) tags.push('sand');
  if (ids.some(id => ['pelipper', 'politoed'].includes(id))) tags.push('rain');
  if (ids.includes('charizard') && ids.includes('venusaur')) tags.push('sun');
  if (ids.some(id => ['ninetalesalola', 'froslass', 'froslassmega'].includes(id))) tags.push('screens');
  if (ids.some(id => ['whimsicott', 'talonflame'].includes(id))) tags.push('tailwind');
  if (ids.some(id => ['farigiraf', 'hatterene', 'oranguru', 'torkoal'].includes(id))) tags.push('trick-room');
  if (ids.includes('incineroar') || ids.includes('maushold')) tags.push('fake-out');
  if (ids.some(id => id.includes('mega'))) tags.push('mega');
  return tags;
}

function buildComboQuery(size: number) {
  if (size === 6) {
    return sql`
      WITH sorted_teams AS (
        SELECT
          tournament_id, player_name, wins, losses, ties,
          (SELECT array_agg(p ORDER BY p) FROM unnest(pokemon_list) AS p) AS sorted_pokemon
        FROM tournament_entries
        WHERE array_length(pokemon_list, 1) = 6
      ),
      grouped AS (
        SELECT
          sorted_pokemon,
          COUNT(*) AS frequency,
          ROUND(AVG(CASE WHEN wins + losses > 0 THEN wins * 100.0 / (wins + losses) END), 1) AS avg_win_rate,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM tournament_entries WHERE array_length(pokemon_list, 1) = 6), 1) AS usage_percent
        FROM sorted_teams
        GROUP BY sorted_pokemon
        HAVING COUNT(*) >= 2
        ORDER BY COUNT(*) DESC
        LIMIT 30
      )
      SELECT * FROM grouped
    `;
  }

  if (size === 2) {
    return sql`
      WITH team_combos AS (
        SELECT
          t.wins, t.losses,
          (SELECT array_agg(p ORDER BY p) FROM unnest(ARRAY[combos.p1, combos.p2]) AS p) AS sorted_combo
        FROM tournament_entries t,
        LATERAL (
          SELECT a.p AS p1, b.p AS p2
          FROM unnest(t.pokemon_list) WITH ORDINALITY AS a(p, i),
               unnest(t.pokemon_list) WITH ORDINALITY AS b(p, j)
          WHERE a.i < b.j
        ) combos
        WHERE array_length(t.pokemon_list, 1) = 6
      )
      SELECT sorted_combo AS sorted_pokemon, COUNT(*) AS frequency,
        ROUND(AVG(CASE WHEN wins+losses>0 THEN wins*100.0/(wins+losses) END), 1) AS avg_win_rate,
        ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM tournament_entries WHERE array_length(pokemon_list,1)=6), 1) AS usage_percent
      FROM team_combos
      GROUP BY sorted_combo
      HAVING COUNT(*) >= 3
      ORDER BY COUNT(*) DESC
      LIMIT 30
    `;
  }

  if (size === 3) {
    return sql`
      WITH team_combos AS (
        SELECT
          t.wins, t.losses,
          (SELECT array_agg(p ORDER BY p) FROM unnest(ARRAY[combos.p1, combos.p2, combos.p3]) AS p) AS sorted_combo
        FROM tournament_entries t,
        LATERAL (
          SELECT a.p AS p1, b.p AS p2, c.p AS p3
          FROM unnest(t.pokemon_list) WITH ORDINALITY AS a(p, i),
               unnest(t.pokemon_list) WITH ORDINALITY AS b(p, j),
               unnest(t.pokemon_list) WITH ORDINALITY AS c(p, k)
          WHERE a.i < b.j AND b.j < c.k
        ) combos
        WHERE array_length(t.pokemon_list, 1) = 6
      )
      SELECT sorted_combo AS sorted_pokemon, COUNT(*) AS frequency,
        ROUND(AVG(CASE WHEN wins+losses>0 THEN wins*100.0/(wins+losses) END), 1) AS avg_win_rate,
        ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM tournament_entries WHERE array_length(pokemon_list,1)=6), 1) AS usage_percent
      FROM team_combos
      GROUP BY sorted_combo
      HAVING COUNT(*) >= 3
      ORDER BY COUNT(*) DESC
      LIMIT 30
    `;
  }

  // size === 4
  return sql`
    WITH team_combos AS (
      SELECT
        t.wins, t.losses,
        (SELECT array_agg(p ORDER BY p) FROM unnest(ARRAY[combos.p1, combos.p2, combos.p3, combos.p4]) AS p) AS sorted_combo
      FROM tournament_entries t,
      LATERAL (
        SELECT a.p AS p1, b.p AS p2, c.p AS p3, d.p AS p4
        FROM unnest(t.pokemon_list) WITH ORDINALITY AS a(p, i),
             unnest(t.pokemon_list) WITH ORDINALITY AS b(p, j),
             unnest(t.pokemon_list) WITH ORDINALITY AS c(p, k),
             unnest(t.pokemon_list) WITH ORDINALITY AS d(p, l)
        WHERE a.i < b.j AND b.j < c.k AND c.k < d.l
      ) combos
      WHERE array_length(t.pokemon_list, 1) = 6
    )
    SELECT sorted_combo AS sorted_pokemon, COUNT(*) AS frequency,
      ROUND(AVG(CASE WHEN wins+losses>0 THEN wins*100.0/(wins+losses) END), 1) AS avg_win_rate,
      ROUND(COUNT(*)*100.0/(SELECT COUNT(*) FROM tournament_entries WHERE array_length(pokemon_list,1)=6), 1) AS usage_percent
    FROM team_combos
    GROUP BY sorted_combo
    HAVING COUNT(*) >= 3
    ORDER BY COUNT(*) DESC
    LIMIT 30
  `;
}

const getCommonTeamsPayload = unstable_cache(
  async (size: 2 | 3 | 4 | 6) => buildCommonTeamsPayload(size),
  ['common-teams-payload-v1'],
  { revalidate: 3600, tags: ['pipeline-snapshot', 'common-teams'] },
);

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sizeParam = parseInt(searchParams.get('size') || '6', 10);
  const size: 2 | 3 | 4 | 6 = ([2, 3, 4, 6] as const).includes(sizeParam as 2 | 3 | 4 | 6)
    ? (sizeParam as 2 | 3 | 4 | 6)
    : 6;
  const payload = await getCommonTeamsPayload(size);
  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300' },
  });
}

async function buildCommonTeamsPayload(size: 2 | 3 | 4 | 6) {
  const rawResults = await db.execute(buildComboQuery(size));

  const results = rawResults as unknown as {
    sorted_pokemon: string[];
    frequency: string;
    avg_win_rate: string | null;
    usage_percent: string;
  }[];

  // Fetch meta scores for computing team meta score
  const metaScoreRows = await db
    .select({ pokemonId: tierlistEntries.pokemonId, metaScore: tierlistEntries.metaScore })
    .from(tierlistEntries);
  const metaScoreMap = new Map(metaScoreRows.map(r => [r.pokemonId, r.metaScore]));

  // Fetch Pokemon data for sprites
  const pokemonRows = await db.select({ id: pokemon.id, name: pokemon.name, spriteId: pokemon.spriteId, types: pokemon.types }).from(pokemon);
  const pokemonMap = new Map(pokemonRows.map(r => [r.id, r]));

  const teams = results.map(r => {
    const pokemonList = r.sorted_pokemon;
    const ids = pokemonList.map(normalizeId);
    const baseIds = ids.map(toBaseFormId);
    const scores = ids.map((id, i) => metaScoreMap.get(id) ?? metaScoreMap.get(baseIds[i]) ?? 0);
    const metaScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

    const pokemonData = pokemonList.map(name => {
      const id = normalizeId(name);
      const baseId = toBaseFormId(id);
      const data = pokemonMap.get(id) || pokemonMap.get(baseId);
      return {
        species: data?.name || name,
        spriteId: data?.spriteId || id,
        types: data?.types || [],
      };
    });

    return {
      id: ids.sort().join('-'),
      pokemon: pokemonData,
      frequency: parseInt(r.frequency),
      usagePercent: parseFloat(r.usage_percent),
      avgWinRate: r.avg_win_rate ? parseFloat(r.avg_win_rate) : null,
      metaScore,
      tags: inferTags(ids),
    };
  });

  return { teams, total: teams.length };
}
