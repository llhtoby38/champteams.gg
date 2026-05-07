/**
 * Replace learnset data with Champions-specific movesets from Showdown.
 * Source: https://github.com/smogon/pokemon-showdown/blob/master/data/mods/champions/learnsets.ts
 *
 * This is the AUTHORITATIVE source for which moves each Pokemon can learn
 * in Pokemon Champions. It replaces the generic @pkmn/dex Gen 9 data which
 * includes moves from previous generations that aren't available in Champions
 * (e.g., Scald on Empoleon, Pursuit on Beedrill).
 *
 * Usage: npx tsx scripts/seed-champions-learnsets.ts
 */

import { db, client } from './db';
import { learnsets, moves } from '../src/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

const LEARNSET_URL = 'https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/mods/champions/learnsets.ts';

interface ParsedLearnset {
  pokemonId: string;
  moveIds: string[];
}

async function fetchAndParse(): Promise<ParsedLearnset[]> {
  console.log(`Fetching ${LEARNSET_URL}...`);
  const res = await fetch(LEARNSET_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const content = await res.text();

  const results: ParsedLearnset[] = [];

  // Parse the TypeScript object. Format:
  // pokemonid: { learnset: { moveid: ["9M"], ... } },
  const pokemonRegex = /\t(\w+):\s*\{\s*learnset:\s*\{([^}]+)\}/g;
  let match;
  while ((match = pokemonRegex.exec(content)) !== null) {
    const pokemonId = match[1];
    const movesBlock = match[2];

    // Extract move IDs
    const moveIds: string[] = [];
    const moveRegex = /(\w+):\s*\[/g;
    let moveMatch;
    while ((moveMatch = moveRegex.exec(movesBlock)) !== null) {
      moveIds.push(moveMatch[1]);
    }

    results.push({ pokemonId, moveIds });
  }

  return results;
}

async function seed() {
  const parsed = await fetchAndParse();
  console.log(`Parsed ${parsed.length} Pokemon learnsets from Showdown Champions mod`);

  // Get all valid move IDs and pokemon IDs from our DB
  const allMoves = await db.select({ id: moves.id }).from(moves);
  const validMoveIds = new Set(allMoves.map(m => m.id));

  const { pokemon } = await import('../src/lib/db/schema');
  const allPokemon = await db.select({ id: pokemon.id }).from(pokemon);
  const validPokemonIds = new Set(allPokemon.map(p => p.id));

  // Delete ALL existing learnsets and replace with Champions data
  console.log('Clearing existing learnsets...');
  await db.delete(learnsets);

  let totalInserted = 0;
  let skippedMoves = new Set<string>();

  let skippedPokemon = 0;
  for (const { pokemonId, moveIds } of parsed) {
    if (!validPokemonIds.has(pokemonId)) {
      skippedPokemon++;
      continue;
    }

    const rows: { pokemonId: string; moveId: string; learnMethod: string }[] = [];

    for (const moveId of moveIds) {
      if (validMoveIds.has(moveId)) {
        rows.push({ pokemonId, moveId, learnMethod: 'champions' });
      } else {
        skippedMoves.add(moveId);
      }
    }

    if (rows.length > 0) {
      // Insert in chunks
      for (let i = 0; i < rows.length; i += 50) {
        await db.insert(learnsets).values(rows.slice(i, i + 50)).onConflictDoNothing();
      }
      totalInserted += rows.length;
    }
  }

  if (skippedMoves.size > 0) {
    console.log(`\nSkipped ${skippedMoves.size} moves not in our moves table:`);
    console.log('  ' + Array.from(skippedMoves).slice(0, 20).join(', '));
    if (skippedMoves.size > 20) console.log(`  ... and ${skippedMoves.size - 20} more`);
  }

  if (skippedPokemon > 0) console.log(`Skipped ${skippedPokemon} Pokemon not in our DB`);
  console.log(`\nSeeded ${totalInserted} learnset entries for ${parsed.length - skippedPokemon} Pokemon`);
  console.log('Champions learnset data is now the source of truth.');

  await client.end();
}

seed().catch(e => {
  console.error('Seed failed:', e);
  client.end();
  process.exit(1);
});
