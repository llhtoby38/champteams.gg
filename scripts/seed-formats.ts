import { db, client } from './db';
import { formats, pokemonFormats, pokemon } from '../src/lib/db/schema';
import { sql, inArray } from 'drizzle-orm';

/**
 * Pokemon Champions Roster (~199 base species + regional forms)
 * Source: https://www.serebii.net/pokemonchampions/pokemon.shtml (updated 2026-04-08)
 * Includes base forms — Mega forms are added automatically below.
 */
const CHAMPIONS_ROSTER = [
  // Gen 1
  'venusaur', 'charizard', 'blastoise', 'beedrill', 'pidgeot',
  'arbok', 'pikachu', 'raichu', 'raichualola', 'clefable',
  'ninetales', 'ninetalesalola', 'arcanine', 'arcaninehisui',
  'alakazam', 'machamp', 'victreebel', 'slowbro', 'slowbrogalar',
  'gengar', 'kangaskhan', 'starmie', 'pinsir', 'tauros', 'taurospaldeacombat', 'taurospaldeablaze', 'taurospaldeaaqua',
  'gyarados', 'ditto', 'vaporeon', 'jolteon', 'flareon',
  'aerodactyl', 'snorlax', 'dragonite',
  // Gen 2
  'meganium', 'typhlosion', 'typhlosionhisui', 'feraligatr',
  'ariados', 'ampharos', 'azumarill', 'politoed', 'espeon', 'umbreon',
  'slowking', 'slowkinggalar', 'forretress', 'steelix', 'scizor',
  'heracross', 'skarmory', 'houndoom', 'tyranitar',
  // Gen 3
  'pelipper', 'gardevoir', 'sableye', 'aggron', 'medicham',
  'manectric', 'sharpedo', 'camerupt', 'torkoal', 'altaria',
  'milotic', 'castform', 'banette', 'chimecho', 'absol', 'glalie',
  // Gen 4
  'torterra', 'infernape', 'empoleon', 'luxray', 'roserade',
  'rampardos', 'bastiodon', 'lopunny', 'spiritomb', 'garchomp',
  'lucario', 'hippowdon', 'toxicroak', 'abomasnow', 'weavile',
  'rhyperior', 'leafeon', 'glaceon', 'gliscor', 'mamoswine',
  'gallade', 'froslass', 'rotom',
  'rotomwash', 'rotomheat', 'rotommow', 'rotomfan', 'rotomfrost',
  // Gen 5
  'serperior', 'emboar', 'samurott', 'samurotthisui',
  'watchog', 'liepard', 'simisage', 'simisear', 'simipour',
  'excadrill', 'audino', 'conkeldurr', 'whimsicott', 'krookodile',
  'cofagrigus', 'garbodor', 'zoroark', 'zoroarkhisui', 'reuniclus',
  'vanilluxe', 'emolga', 'chandelure', 'beartic',
  'stunfisk', 'stunfiskgalar', 'golurk', 'hydreigon', 'volcarona',
  // Gen 6
  'chesnaught', 'delphox', 'greninja', 'diggersby', 'talonflame',
  'vivillon', 'floette', 'florges', 'pangoro', 'furfrou', 'meowstic', 'meowsticf',
  'aegislash', 'aromatisse', 'slurpuff', 'clawitzer', 'heliolisk',
  'tyrantrum', 'aurorus', 'sylveon', 'hawlucha', 'dedenne',
  'goodra', 'goodrahisui', 'klefki', 'trevenant', 'gourgeist',
  'avalugg', 'avalugghisui', 'noivern',
  // Gen 7
  'decidueye', 'decidueyehisui', 'incineroar', 'primarina',
  'toucannon', 'crabominable', 'lycanroc', 'lycanrocdusk', 'lycanrocmidnight',
  'toxapex', 'mudsdale',
  'araquanid', 'salazzle', 'tsareena', 'oranguru', 'passimian',
  'mimikyu', 'drampa', 'kommoo',
  // Gen 8
  'corviknight', 'flapple', 'appletun', 'sandaconda', 'polteageist',
  'hatterene', 'mrrime', 'runerigus', 'alcremie', 'morpeko', 'dragapult',
  'wyrdeer', 'kleavor', 'basculegion', 'basculegionf', 'sneasler',
  // Gen 9
  'meowscarada', 'skeledirge', 'quaquaval', 'maushold',
  'garganacl', 'armarouge', 'ceruledge', 'bellibolt', 'scovillain',
  'espathra', 'tinkaton', 'palafin', 'orthworm', 'glimmora',
  'farigiraf', 'kingambit', 'sinistcha', 'archaludon', 'hydrapple',
];

// These constants are retained for reference but not used in the current seed.
// Add back when SV formats are re-introduced.
const REG_H_BANNED = [
  // Box Legends
  'koraidon', 'miraidon', 'mewtwo', 'lugia', 'hooh', 'kyogre', 'groudon',
  'rayquaza', 'dialga', 'dialgaorigin', 'palkia', 'palkiaorigin',
  'giratina', 'giratinaorigin', 'reshiram', 'zekrom', 'kyurem',
  'kyuremblack', 'kyuremwhite', 'solgaleo', 'lunala', 'necrozma',
  'necrozmaduskmane', 'necrozmadawnwings', 'zacian', 'zaciancrowned',
  'zamazenta', 'zamazentacrowned', 'eternatus', 'calyrex',
  'calyrexice', 'calyrexshadow', 'terapagos', 'terapagosstellar',
  // Sub-legends
  'articuno', 'articunogalar', 'zapdos', 'zapdosgalar', 'moltres', 'moltresgalar',
  'raikou', 'entei', 'suicune', 'regirock', 'regice', 'registeel',
  'latias', 'latios', 'uxie', 'mesprit', 'azelf', 'heatran',
  'regigigas', 'cresselia', 'cobalion', 'terrakion', 'virizion',
  'tornadus', 'tornadustherian', 'thundurus', 'thundurustherian',
  'landorus', 'landorustherian', 'kubfu', 'urshifu', 'urshifurapidstrike',
  'regieleki', 'regidrago', 'glastrier', 'spectrier', 'enamorus',
  'enamorustherian',
  'wochien', 'chienpao', 'tinglu', 'chiyu',
  'ogerpon', 'ogerponcornerstone', 'ogerponhearthflame', 'ogerpenwellspring',
  'okidogi', 'munkidori', 'fezandipiti',
  // Mythicals
  'mew', 'jirachi', 'deoxys', 'deoxysattack', 'deoxysdefense', 'deoxysspeed',
  'phione', 'manaphy', 'darkrai', 'shaymin', 'shayminsky', 'arceus',
  'keldeo', 'keldeoresolute', 'meloetta', 'meloettapirouette',
  'diancie', 'hoopa', 'hoopaunbound', 'volcanion', 'magearna',
  'magearnaoriginal', 'zarude', 'zarudedada', 'pecharunt',
  // Paradox Pokemon
  'greattusk', 'screamtail', 'brutebonnet', 'fluttermane', 'slitherwing',
  'sandyshocks', 'irontreads', 'ironbundle', 'ironhands', 'ironjugulis',
  'ironmoth', 'ironthorns', 'roaringmoon', 'ironvaliant',
  'walkingwake', 'ironleaves', 'gougingfire', 'ragingbolt',
  'ironboulder', 'ironcrown',
  // Battle Bond
  'greninjaash',
];

/**
 * Restricted Pokemon for Reg G (1 allowed) and Reg I (2 allowed)
 */
const RESTRICTED_LEGENDS = [
  'mewtwo', 'lugia', 'hooh', 'kyogre', 'groudon', 'rayquaza',
  'dialga', 'dialgaorigin', 'palkia', 'palkiaorigin',
  'giratina', 'giratinaorigin', 'reshiram', 'zekrom', 'kyurem',
  'kyuremblack', 'kyuremwhite', 'solgaleo', 'lunala', 'necrozma',
  'necrozmaduskmane', 'necrozmadawnwings',
  'zacian', 'zaciancrowned', 'zamazenta', 'zamazentacrowned', 'eternatus',
  'calyrex', 'calyrexice', 'calyrexshadow',
  'koraidon', 'miraidon', 'terapagos', 'terapagosstellar',
];

const MYTHICAL_POKEMON = [
  'mew', 'jirachi', 'deoxys', 'deoxysattack', 'deoxysdefense', 'deoxysspeed',
  'phione', 'manaphy', 'darkrai', 'shaymin', 'shayminsky', 'arceus',
  'keldeo', 'keldeoresolute', 'meloetta', 'meloettapirouette',
  'diancie', 'hoopa', 'hoopaunbound', 'volcanion', 'magearna',
  'magearnaoriginal', 'zarude', 'zarudedada', 'pecharunt',
];

async function seedFormats() {
  console.log('Seeding formats...');

  // Clear existing
  await db.delete(pokemonFormats);
  await db.delete(formats);

  // Insert formats
  await db.insert(formats).values([
    {
      id: 'season-m1',
      name: 'Season M-1',
      game: 'champions',
      description: 'Pokemon Champions launch season. Doubles, Mega Evolution via Omni Ring. Curated ~199 Pokemon roster.',
      restrictedCount: 0,
      isActive: true,
      sortOrder: 1,
    },
    {
      id: 'champions-all',
      name: 'All Pokemon',
      game: 'champions',
      description: 'Unrestricted format — all Pokemon, items, and moves available for flexible team building.',
      restrictedCount: 0,
      isActive: true,
      sortOrder: 2,
    },
  ]);

  // Get all pokemon IDs from DB
  const allPokemon = await db.select({ id: pokemon.id }).from(pokemon);

  // Season M-1: curated roster + their mega forms
  const seasonEntries: (typeof pokemonFormats.$inferInsert)[] = [];
  const championsSet = new Set(CHAMPIONS_ROSTER);
  const championsAdded = new Set<string>();

  for (const p of allPokemon) {
    if (championsAdded.has(p.id)) continue;
    if (championsSet.has(p.id)) {
      seasonEntries.push({ pokemonId: p.id, formatId: 'season-m1', isRestricted: false, isBanned: false });
      championsAdded.add(p.id);
      continue;
    }
    if (p.id.includes('mega')) {
      // Strip mega suffix(es) to find the base species
      // Try standard suffix first, then gender-prefixed mega (meowsticmmega, meowsticfmega)
      const baseName = p.id.replace(/mega[xyz]?$/, '');
      const baseNameGender = p.id.replace(/[mf]mega[xyz]?$/, '');
      if (championsSet.has(baseName) || championsSet.has(baseNameGender)) {
        seasonEntries.push({ pokemonId: p.id, formatId: 'season-m1', isRestricted: false, isBanned: false });
        championsAdded.add(p.id);
      }
    }
  }

  // All Pokemon format: every Pokemon in DB
  const allEntries: (typeof pokemonFormats.$inferInsert)[] = allPokemon.map(p => ({
    pokemonId: p.id,
    formatId: 'champions-all',
    isRestricted: false,
    isBanned: false,
  }));

  // Insert in chunks
  const allFormatEntries = [...seasonEntries, ...allEntries];
  for (let i = 0; i < allFormatEntries.length; i += 500) {
    await db.insert(pokemonFormats).values(allFormatEntries.slice(i, i + 500));
  }

  console.log(`Seeded 2 formats with ${allFormatEntries.length} pokemon-format entries`);
  console.log(`  Season M-1: ${seasonEntries.length} Pokemon`);
  console.log(`  All Pokemon: ${allEntries.length} Pokemon`);
}

export { seedFormats };

if (require.main === module) {
  seedFormats()
    .then(() => client.end())
    .catch((e) => {
      console.error(e);
      client.end();
      process.exit(1);
    });
}
