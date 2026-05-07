import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import { Sprites } from '@pkmn/img';
import { eq } from 'drizzle-orm';
import { db, client } from './db';
import { pokemon } from '../src/lib/db/schema';

/**
 * Convert a @pkmn/dex species ID to the Showdown sprite filename.
 * Uses @pkmn/img to get the correct hyphenated name.
 * e.g., "raichualola" -> "raichu-alola"
 */
function getSpriteFileName(speciesId: string): string {
  try {
    const result = Sprites.getPokemon(speciesId, { gen: 'ani' as 'ani' });
    // Extract filename without extension from URL
    const url = result.url;
    const fileName = url.split('/').pop()?.replace(/\.(gif|png)$/, '') || speciesId;
    return fileName;
  } catch {
    return speciesId;
  }
}

async function seedPokemon() {
  console.log('Seeding pokemon...');

  const gens = new Generations(Dex);
  const gen = gens.get(9);

  const rows: (typeof pokemon.$inferInsert)[] = [];

  // Include standard gen9 species
  for (const species of gen.species) {
    if (species.isNonstandard) continue;
    const s = species as unknown as Record<string, unknown>;
    rows.push({
      id: species.id,
      name: species.name,
      dexNum: species.num,
      types: [...species.types],
      baseStats: { ...species.baseStats },
      abilities: { ...species.abilities },
      heightm: (s.heightm as number) ?? null,
      weightkg: (s.weightkg as number) ?? null,
      tier: (s.tier as string) || null,
      tags: s.tags ? [...(s.tags as string[])] : null,
      otherFormes: s.otherFormes ? [...(s.otherFormes as string[])] : null,
      baseSpecies: species.baseSpecies !== species.name ? species.baseSpecies : null,
      spriteId: getSpriteFileName(species.id),
    });
  }

  // Also include "Past" Pokemon needed for Champions (not in SV but in the Champions roster)
  const CHAMPIONS_PAST_POKEMON = new Set([
    // Gen 1
    'beedrill', 'arbok', 'pidgeot', 'alakazam', 'machamp',
    'victreebel', 'kangaskhan', 'starmie', 'pinsir', 'aerodactyl',
    // Gen 2
    'ariados', 'forretress', 'steelix',
    // Gen 3
    'aggron', 'medicham', 'manectric', 'sharpedo', 'camerupt',
    'castform', 'banette', 'chimecho', 'absol', 'glalie',
    // Gen 4
    'luxray', 'roserade', 'rampardos', 'bastiodon', 'lopunny', 'toxicroak',
    // Gen 5
    'watchog', 'liepard', 'simisage', 'simisear', 'simipour',
    'audino', 'cofagrigus', 'garbodor', 'reuniclus', 'vanilluxe',
    'emolga', 'beartic', 'stunfisk', 'stunfiskgalar',
    // Gen 6
    'diggersby', 'furfrou', 'pangoro', 'aegislash',
    'aromatisse', 'slurpuff', 'heliolisk', 'tyrantrum', 'aurorus',
    'dedenne', 'gourgeist',
    // Gen 7
    'drampa',
    // Gen 8
    'mrrime', 'runerigus',
    // Gen 8 (cross-gen)
    'salazzle', 'passimian',
  ]);

  const seenIds = new Set(rows.map(r => r.id));
  for (const species of Dex.species.all()) {
    if (seenIds.has(species.id)) continue;
    if (species.isNonstandard === 'CAP') continue;

    const isPastChampion = CHAMPIONS_PAST_POKEMON.has(species.id);
    const isMega = !!(species.isMega || (species.forme && (species.forme.startsWith('Mega') || species.forme.includes('-Mega') || species.forme.endsWith('Mega'))));

    if (!isPastChampion && !isMega) continue;

    const s = species as unknown as Record<string, unknown>;
    rows.push({
      id: species.id,
      name: species.name,
      dexNum: species.num,
      types: [...species.types],
      baseStats: { ...species.baseStats },
      abilities: { ...species.abilities },
      heightm: (s.heightm as number) ?? null,
      weightkg: (s.weightkg as number) ?? null,
      tier: (s.tier as string) || null,
      tags: isMega ? ['Mega Evolution'] : (s.tags ? [...(s.tags as string[])] : null),
      otherFormes: isMega ? null : (s.otherFormes ? [...(s.otherFormes as string[])] : null),
      baseSpecies: species.baseSpecies !== species.name ? species.baseSpecies : null,
      spriteId: getSpriteFileName(species.id),
    });
    seenIds.add(species.id);
  }

  // Batch upsert
  if (rows.length > 0) {
    await db.delete(pokemon);
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      await db.insert(pokemon).values(chunk);
    }
  }

  // ── Champions-specific overrides ────────────────────────────────────────
  // Pokemon Champions has data not present in @pkmn/dex (Gen 9).
  // Source: serebii.net/pokedex-champions/{pokemon}/

  // Sprite overrides: Champions uses Eternal Flower Floette as the base form.
  await db.update(pokemon)
    .set({ spriteId: 'floette-eternal' })
    .where(eq(pokemon.id, 'floette'));

  // Mega ability overrides from pokemon-showdown/data/pokedex.ts.
  // Each mega has a single fixed ability that cannot be changed.
  const championsMegaAbilities: { megaId: string; ability: string }[] = [
    { megaId: 'venusaurmega', ability: 'Thick Fat' },
    { megaId: 'charizardmegax', ability: 'Tough Claws' },
    { megaId: 'charizardmegay', ability: 'Drought' },
    { megaId: 'blastoisemega', ability: 'Mega Launcher' },
    { megaId: 'beedrillmega', ability: 'Adaptability' },
    { megaId: 'pidgeotmega', ability: 'No Guard' },
    { megaId: 'raichumegax', ability: 'Surge Surfer' },
    { megaId: 'raichumegay', ability: 'Surge Surfer' },
    { megaId: 'clefablemega', ability: 'Magic Bounce' },
    { megaId: 'alakazammega', ability: 'Trace' },
    { megaId: 'victreebelmega', ability: 'Innards Out' },
    { megaId: 'slowbromega', ability: 'Shell Armor' },
    { megaId: 'gengarmega', ability: 'Shadow Tag' },
    { megaId: 'kangaskhanmega', ability: 'Parental Bond' },
    { megaId: 'starmiemega', ability: 'Huge Power' },
    { megaId: 'pinsirmega', ability: 'Aerilate' },
    { megaId: 'gyaradosmega', ability: 'Mold Breaker' },
    { megaId: 'aerodactylmega', ability: 'Tough Claws' },
    { megaId: 'dragonitemega', ability: 'Multiscale' },
    { megaId: 'meganiummega', ability: 'Mega Sol' },
    { megaId: 'feraligatrmega', ability: 'Dragonize' },
    { megaId: 'ampharosmega', ability: 'Mold Breaker' },
    { megaId: 'steelixmega', ability: 'Sand Force' },
    { megaId: 'scizormega', ability: 'Technician' },
    { megaId: 'heracrossmega', ability: 'Skill Link' },
    { megaId: 'skarmorymega', ability: 'Stalwart' },
    { megaId: 'houndoommega', ability: 'Solar Power' },
    { megaId: 'tyranitarmega', ability: 'Sand Stream' },
    { megaId: 'sceptilemega', ability: 'Lightning Rod' },
    { megaId: 'blazikenmega', ability: 'Speed Boost' },
    { megaId: 'swampertmega', ability: 'Swift Swim' },
    { megaId: 'gardevoirmega', ability: 'Pixilate' },
    { megaId: 'sableyemega', ability: 'Magic Bounce' },
    { megaId: 'mawilemega', ability: 'Huge Power' },
    { megaId: 'aggronmega', ability: 'Filter' },
    { megaId: 'medichammega', ability: 'Pure Power' },
    { megaId: 'manectricmega', ability: 'Intimidate' },
    { megaId: 'sharpedomega', ability: 'Strong Jaw' },
    { megaId: 'cameruptmega', ability: 'Sheer Force' },
    { megaId: 'altariamega', ability: 'Pixilate' },
    { megaId: 'banettemega', ability: 'Prankster' },
    { megaId: 'chimechomega', ability: 'Levitate' },
    { megaId: 'absolmega', ability: 'Magic Bounce' },
    { megaId: 'glaliemega', ability: 'Refrigerate' },
    { megaId: 'salamencemega', ability: 'Aerilate' },
    { megaId: 'metagrossmega', ability: 'Tough Claws' },
    { megaId: 'latiasmega', ability: 'Levitate' },
    { megaId: 'latiosmega', ability: 'Levitate' },
    { megaId: 'rayquazamega', ability: 'Delta Stream' },
    { megaId: 'staraptormega', ability: 'Intimidate' },
    { megaId: 'lopunnymega', ability: 'Scrappy' },
    { megaId: 'garchompmega', ability: 'Sand Force' },
    { megaId: 'lucariomega', ability: 'Adaptability' },
    { megaId: 'abomasnowmega', ability: 'Snow Warning' },
    { megaId: 'gallademega', ability: 'Inner Focus' },
    { megaId: 'froslassmega', ability: 'Snow Warning' },
    { megaId: 'heatranmega', ability: 'Flash Fire' },
    { megaId: 'darkraimega', ability: 'Bad Dreams' },
    { megaId: 'emboarmega', ability: 'Mold Breaker' },
    { megaId: 'excadrillmega', ability: 'Piercing Drill' },
    { megaId: 'audinomega', ability: 'Healer' },
    { megaId: 'scolipedemega', ability: 'Poison Point' },
    { megaId: 'scraftymega', ability: 'Shed Skin' },
    { megaId: 'eelektrossmega', ability: 'Levitate' },
    { megaId: 'chandeluremega', ability: 'Infiltrator' },
    { megaId: 'golurkmega', ability: 'Unseen Fist' },
    { megaId: 'chesnaughtmega', ability: 'Bulletproof' },
    { megaId: 'delphoxmega', ability: 'Levitate' },
    { megaId: 'greninjamega', ability: 'Protean' },
    { megaId: 'pyroarmega', ability: 'Rivalry' },
    { megaId: 'floettemega', ability: 'Fairy Aura' },
    { megaId: 'malamarmega', ability: 'Contrary' },
    { megaId: 'barbaraclemega', ability: 'Tough Claws' },
    { megaId: 'dragalgemega', ability: 'Poison Point' },
    { megaId: 'hawluchamega', ability: 'No Guard' },
    { megaId: 'dianciemega', ability: 'Magic Bounce' },
    { megaId: 'crabominablemega', ability: 'Iron Fist' },
    { megaId: 'golisopodmega', ability: 'Emergency Exit' },
    { megaId: 'drampamega', ability: 'Berserk' },
    { megaId: 'magearnamega', ability: 'Soul-Heart' },
    { megaId: 'zeraoramega', ability: 'Volt Absorb' },
    { megaId: 'falinksmega', ability: 'Battle Armor' },
    { megaId: 'scovillainmega', ability: 'Spicy Spray' },
    { megaId: 'glimmoramega', ability: 'Adaptability' },
    { megaId: 'tatsugiricurlymega', ability: 'Commander' },
    { megaId: 'tatsugiridroopymega', ability: 'Commander' },
    { megaId: 'tatsugiristretchymega', ability: 'Commander' },
    { megaId: 'baxcaliburmega', ability: 'Thermal Exchange' },
  ];
  for (const { megaId, ability } of championsMegaAbilities) {
    await db.update(pokemon)
      .set({ abilities: { '0': ability } })
      .where(eq(pokemon.id, megaId));
  }

  // Base stat overrides where @pkmn/dex data (sourced from Pokemon Legends: Z-A or
  // other non-Champions sources) differs from Pokemon Champions.
  // Source: serebii.net/pokedex-champions/{pokemon}/
  const championsStatOverrides: { id: string; baseStats: Record<string, number> }[] = [
    // Mega Starmie: @pkmn/dex uses Z-A stats (Atk 140); Champions has Atk 100.
    { id: 'starmiemega', baseStats: { hp: 60, atk: 100, def: 105, spa: 130, spd: 105, spe: 120 } },
  ];
  for (const { id, baseStats } of championsStatOverrides) {
    await db.update(pokemon)
      .set({ baseStats })
      .where(eq(pokemon.id, id));
  }

  console.log(`Seeded ${rows.length} pokemon (+${championsMegaAbilities.length} mega ability overrides, +${championsStatOverrides.length} stat overrides)`);
}

export { seedPokemon };

if (require.main === module) {
  seedPokemon()
    .then(() => client.end())
    .catch((e) => {
      console.error(e);
      client.end();
      process.exit(1);
    });
}
