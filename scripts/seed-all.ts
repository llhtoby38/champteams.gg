import { db, client } from './db';
import { learnsets, pokemonFormats } from '../src/lib/db/schema';
import { seedPokemon } from './seed-pokemon';
import { seedMoves } from './seed-moves';
import { seedAbilities } from './seed-abilities';
import { seedItems } from './seed-items';
import { seedLearnsets } from './seed-learnsets';
import { seedTypeChart } from './seed-typechart';
import { seedNatures } from './seed-natures';
import { seedFormats } from './seed-formats';

async function seedAll() {
  console.log('=== Starting full data pipeline ===\n');

  const start = Date.now();

  // Clear tables with FK references first
  console.log('Clearing FK-dependent tables...');
  await db.delete(pokemonFormats);
  await db.delete(learnsets);

  // Seed independent tables
  await seedPokemon();
  await seedMoves();
  await seedAbilities();
  await seedItems();
  await seedTypeChart();
  await seedNatures();

  // Seed dependent tables
  await seedLearnsets();
  await seedFormats();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n=== Data pipeline complete in ${elapsed}s ===`);
}

seedAll()
  .then(() => client.end())
  .catch((e) => {
    console.error('Seed failed:', e);
    client.end();
    process.exit(1);
  });
