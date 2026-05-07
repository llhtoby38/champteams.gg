import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import { db, client } from './db';
import { learnsets, pokemon as pokemonTable, moves as movesTable } from '../src/lib/db/schema';
import { sql, and, eq } from 'drizzle-orm';

function parseLearnMethod(code: string): string {
  const method = code.charAt(1);
  switch (method) {
    case 'L':
      return 'level-up';
    case 'M':
      return 'tm';
    case 'T':
      return 'tutor';
    case 'E':
      return 'egg';
    case 'S':
      return 'event';
    case 'R':
      return 'special';
    default:
      return 'other';
  }
}

async function seedLearnsets() {
  console.log('Seeding learnsets...');

  const gens = new Generations(Dex);
  const gen = gens.get(9);

  // Get valid pokemon and move IDs from DB to avoid FK violations
  const validPokemon = new Set(
    (await db.select({ id: pokemonTable.id }).from(pokemonTable)).map((r) => r.id),
  );
  const validMoves = new Set(
    (await db.select({ id: movesTable.id }).from(movesTable)).map((r) => r.id),
  );

  const rows: (typeof learnsets.$inferInsert)[] = [];
  const seen = new Set<string>(); // dedupe

  // Process all Pokemon that exist in the DB (including Past Pokemon added for Champions)
  for (const pokemonId of validPokemon) {
    // Try gen9 species first, fall back to Dex for Past Pokemon
    let species = gen.species.get(pokemonId);
    const dexSpecies = Dex.species.get(pokemonId);
    if (!species && !dexSpecies?.exists) continue;
    if (species?.isNonstandard && species.isNonstandard !== 'Past') continue;

    // Walk the full pre-evolution chain to collect all inherited moves
    // (matches Pokemon Showdown behaviour where evolved forms inherit prevo moves)
    const chainMoves = new Map<string, string[]>(); // moveId → learnMethods
    let current: string | null = pokemonId;
    while (current) {
      // Try gen9 learnset first, then fall back to Dex.learnsets for Past Pokemon
      let chainLearnset = await gen.learnsets.get(current);
      if (!chainLearnset) {
        const dexLs = await (Dex.learnsets.get(current) as any);
        if (dexLs?.learnset) chainLearnset = dexLs as any;
      }
      for (const [moveId, learnMethods] of Object.entries(chainLearnset?.learnset || {})) {
        if (!chainMoves.has(moveId)) {
          chainMoves.set(moveId, learnMethods as string[]);
        }
      }
      const speciesData: any = gen.species.get(current) || (Dex.species.get(current)?.exists ? Dex.species.get(current) : null);
      current = speciesData?.prevo ?? null;
    }

    for (const [moveId, learnMethods] of chainMoves) {
      if (!validMoves.has(moveId)) continue;

      const key = `${pokemonId}:${moveId}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Find the best learn method from Gen 9 entries
      let bestMethod = 'other';
      for (const code of learnMethods) {
        if (code.startsWith('9')) {
          bestMethod = parseLearnMethod(code);
          break;
        }
      }
      // Fallback to any method if no Gen 9 entry
      if (bestMethod === 'other' && learnMethods.length > 0) {
        bestMethod = parseLearnMethod(learnMethods[0]);
      }

      rows.push({
        pokemonId,
        moveId,
        learnMethod: bestMethod,
      });
    }
  }

  if (rows.length > 0) {
    await db.delete(learnsets);
    // Insert in larger chunks since these rows are small
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      await db.insert(learnsets).values(chunk);
    }
  }

  console.log(`Seeded ${rows.length} learnset entries for ${validPokemon.size} pokemon`);

  // Champions-specific learnset overrides
  // Pokemon Champions has its own move availability that differs from Showdown Gen 9 data.
  // Source: serebii.net/pokedex-champions/{pokemon}/
  // Additions: moves available in Champions but missing from @pkmn/dex
  const championsAdditions = [
    { pokemonId: 'meganium', moveId: 'earthpower', learnMethod: 'tutor' },
    // AZ's Floette (Eternal Flower) — Light of Ruin is its signature move.
    { pokemonId: 'floette', moveId: 'lightofruin', learnMethod: 'special' },
    // Champions-only moves not present in @pkmn/dex Gen 9 learnset data.
    // Verified against serebii.net/pokedex-champions/{pokemon}/
    { pokemonId: 'aegislash', moveId: 'poltergeist', learnMethod: 'tm' },
    { pokemonId: 'golurk',    moveId: 'headlongrush', learnMethod: 'tm' },
    { pokemonId: 'meganium',  moveId: 'dazzlinggleam', learnMethod: 'tm' },
    { pokemonId: 'starmie',   moveId: 'liquidation', learnMethod: 'tm' },
    { pokemonId: 'starmie',   moveId: 'zenheadbutt', learnMethod: 'tm' },
  ];
  for (const extra of championsAdditions) {
    await db.insert(learnsets).values(extra).onConflictDoNothing();
  }

  // Removals: moves in @pkmn/dex that are NOT available in Champions
  const championsRemovals: { pokemonId: string; moveId: string }[] = [
    { pokemonId: 'incineroar', moveId: 'knockoff' },
    { pokemonId: 'incineroar', moveId: 'uturn' },
    { pokemonId: 'kleavor', moveId: 'crosspoison' },
    { pokemonId: 'kleavor', moveId: 'knockoff' },
  ];
  for (const rem of championsRemovals) {
    await db.delete(learnsets).where(
      and(eq(learnsets.pokemonId, rem.pokemonId), eq(learnsets.moveId, rem.moveId))
    );
  }

  console.log(`Applied ${championsAdditions.length} Champions learnset addition(s), ${championsRemovals.length} removal(s)`);
}

export { seedLearnsets };

if (require.main === module) {
  seedLearnsets()
    .then(() => client.end())
    .catch((e) => {
      console.error(e);
      client.end();
      process.exit(1);
    });
}
