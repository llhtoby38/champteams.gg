import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import { db, client } from './db';
import { natures } from '../src/lib/db/schema';

async function seedNatures() {
  console.log('Seeding natures...');

  const gens = new Generations(Dex);
  const gen = gens.get(9);

  const rows: (typeof natures.$inferInsert)[] = [];

  for (const nature of gen.natures) {
    rows.push({
      id: nature.id,
      name: nature.name,
      plus: nature.plus || null,
      minus: nature.minus || null,
    });
  }

  if (rows.length > 0) {
    await db.delete(natures);
    await db.insert(natures).values(rows);
  }

  console.log(`Seeded ${rows.length} natures`);
}

export { seedNatures };

if (require.main === module) {
  seedNatures()
    .then(() => client.end())
    .catch((e) => {
      console.error(e);
      client.end();
      process.exit(1);
    });
}
