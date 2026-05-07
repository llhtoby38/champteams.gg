import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import { db, client } from './db';
import { typeChart } from '../src/lib/db/schema';

const TYPES = [
  'Normal', 'Fire', 'Water', 'Electric', 'Grass', 'Ice',
  'Fighting', 'Poison', 'Ground', 'Flying', 'Psychic', 'Bug',
  'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy',
];

async function seedTypeChart() {
  console.log('Seeding type chart...');

  const gens = new Generations(Dex);
  const gen = gens.get(9);

  const rows: (typeof typeChart.$inferInsert)[] = [];

  for (const atkType of TYPES) {
    for (const defType of TYPES) {
      const typeData = gen.types.get(defType);
      if (!typeData) continue;

      // damageTaken maps attacking type → effectiveness code
      // 0 = neutral (1x), 1 = super effective (2x), 2 = resist (0.5x), 3 = immune (0x)
      const td = typeData as unknown as { damageTaken: Record<string, number> };
      const effectiveness = td.damageTaken[atkType] ?? 0;

      rows.push({
        attackingType: atkType,
        defendingType: defType,
        effectiveness,
      });
    }
  }

  if (rows.length > 0) {
    await db.delete(typeChart);
    await db.insert(typeChart).values(rows);
  }

  console.log(`Seeded ${rows.length} type chart entries (${TYPES.length}x${TYPES.length})`);
}

export { seedTypeChart };

if (require.main === module) {
  seedTypeChart()
    .then(() => client.end())
    .catch((e) => {
      console.error(e);
      client.end();
      process.exit(1);
    });
}
