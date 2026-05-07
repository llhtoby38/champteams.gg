import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import { db, client } from './db';
import { items } from '../src/lib/db/schema';

/**
 * Champions items — from https://www.serebii.net/pokemonchampions/items.shtml (2026-04-08)
 * Mega stones are auto-detected below; this list is for hold items + berries.
 */
const VGC_RELEVANT_ITEMS = new Set([
  // Hold Items
  'blackbelt', 'blackglasses', 'brightpowder', 'charcoal', 'choicescarf',
  'dragonfang', 'fairyfeather', 'focusband', 'focussash', 'hardstone',
  'kingsrock', 'leftovers', 'lightball', 'magnet', 'mentalherb',
  'metalcoat', 'miracleseed', 'mysticwater', 'nevermeltice', 'poisonbarb',
  'quickclaw', 'scopelens', 'sharpbeak', 'shellbell', 'silkscarf',
  'silverpowder', 'softsand', 'spelltag', 'twistedspoon', 'whiteherb',
  // Berries
  'aspearberry', 'babiriberry', 'chartiberry', 'cheriberry', 'chestoberry',
  'chilanberry', 'chopleberry', 'cobaberry', 'colburberry', 'habanberry',
  'kasibberry', 'kebiaberry', 'leppaberry', 'lumberry', 'occaberry',
  'oranberry', 'passhoberry', 'payapaberry', 'pechaberry', 'persimberry',
  'rawstberry', 'rindoberry', 'roseliberry', 'shucaberry', 'sitrusberry',
  'tangaberry', 'wacanberry', 'yacheberry',
]);

async function seedItems() {
  console.log('Seeding items...');

  const gens = new Generations(Dex);
  const gen = gens.get(9);

  const rows: (typeof items.$inferInsert)[] = [];

  // Also iterate raw Dex to include mega stones (marked as Past/Future in gen9)
  const allItems = Dex.items.all();

  for (const item of allItems) {
    // Include: standard items, mega stones, and future items (for Champions)
    // Skip: CAP items
    if (item.isNonstandard === 'CAP') continue;

    const raw = item as unknown as Record<string, unknown>;
    const isMegaStone = !!(raw.megaStone || raw.megaEvolves);

    rows.push({
      id: item.id,
      name: item.name,
      spriteNum: (item as unknown as { spritenum?: number }).spritenum ?? null,
      description: item.shortDesc || item.desc || null,
      isVgcRelevant: VGC_RELEVANT_ITEMS.has(item.id) || isMegaStone,
    });
  }

  if (rows.length > 0) {
    await db.delete(items);
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      await db.insert(items).values(chunk);
    }
  }

  const vgcCount = rows.filter((r) => r.isVgcRelevant).length;
  console.log(`Seeded ${rows.length} items (${vgcCount} VGC-relevant)`);
}

export { seedItems };

if (require.main === module) {
  seedItems()
    .then(() => client.end())
    .catch((e) => {
      console.error(e);
      client.end();
      process.exit(1);
    });
}
