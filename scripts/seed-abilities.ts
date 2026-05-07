import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import { db, client } from './db';
import { abilities } from '../src/lib/db/schema';

async function seedAbilities() {
  console.log('Seeding abilities...');

  const gens = new Generations(Dex);
  const gen = gens.get(9);

  const rows: (typeof abilities.$inferInsert)[] = [];

  for (const ability of gen.abilities) {
    if (ability.isNonstandard) continue;

    rows.push({
      id: ability.id,
      name: ability.name,
      rating: (ability as unknown as { rating?: number }).rating ?? null,
      description: ability.shortDesc || ability.desc || null,
    });
  }

  // Champions-exclusive abilities (not in @pkmn/dex).
  // Source: serebii.net/pokedex-champions/
  const championsAbilities: (typeof abilities.$inferInsert)[] = [
    {
      id: 'megasol',
      name: 'Mega Sol',
      rating: 4,
      description: 'The Pokémon uses its moves as if the weather were harsh sunlight.',
    },
  ];
  rows.push(...championsAbilities);

  if (rows.length > 0) {
    await db.delete(abilities);
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      await db.insert(abilities).values(chunk);
    }
  }

  console.log(`Seeded ${rows.length} abilities`);
}

export { seedAbilities };

if (require.main === module) {
  seedAbilities()
    .then(() => client.end())
    .catch((e) => {
      console.error(e);
      client.end();
      process.exit(1);
    });
}
