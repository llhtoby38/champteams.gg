/**
 * Static mapping of base species → mega stone(s) and mega form(s).
 * Source: https://github.com/smogon/pokemon-showdown/blob/master/data/items.ts
 *
 * For Pokemon with X/Y/Z variants, the default (first) entry is used
 * when auto-equipping. The full list is available for the item picker.
 */

export interface MegaStoneEntry {
  stone: string;
  mega: string;
}

export const MEGA_STONE_MAP: Record<string, MegaStoneEntry[]> = {
  'Abomasnow': [{ stone: 'Abomasite', mega: 'Abomasnow-Mega' }],
  'Absol': [{ stone: 'Absolite', mega: 'Absol-Mega' }],
  'Aerodactyl': [{ stone: 'Aerodactylite', mega: 'Aerodactyl-Mega' }],
  'Aggron': [{ stone: 'Aggronite', mega: 'Aggron-Mega' }],
  'Alakazam': [{ stone: 'Alakazite', mega: 'Alakazam-Mega' }],
  'Altaria': [{ stone: 'Altarianite', mega: 'Altaria-Mega' }],
  'Ampharos': [{ stone: 'Ampharosite', mega: 'Ampharos-Mega' }],
  'Audino': [{ stone: 'Audinite', mega: 'Audino-Mega' }],
  'Banette': [{ stone: 'Banettite', mega: 'Banette-Mega' }],
  'Barbaracle': [{ stone: 'Barbaracite', mega: 'Barbaracle-Mega' }],
  'Baxcalibur': [{ stone: 'Baxcalibrite', mega: 'Baxcalibur-Mega' }],
  'Beedrill': [{ stone: 'Beedrillite', mega: 'Beedrill-Mega' }],
  'Blastoise': [{ stone: 'Blastoisinite', mega: 'Blastoise-Mega' }],
  'Blaziken': [{ stone: 'Blazikenite', mega: 'Blaziken-Mega' }],
  'Camerupt': [{ stone: 'Cameruptite', mega: 'Camerupt-Mega' }],
  'Chandelure': [{ stone: 'Chandelurite', mega: 'Chandelure-Mega' }],
  'Charizard': [{ stone: 'Charizardite X', mega: 'Charizard-Mega-X' }, { stone: 'Charizardite Y', mega: 'Charizard-Mega-Y' }],
  'Chesnaught': [{ stone: 'Chesnaughtite', mega: 'Chesnaught-Mega' }],
  'Chimecho': [{ stone: 'Chimechite', mega: 'Chimecho-Mega' }],
  'Clefable': [{ stone: 'Clefablite', mega: 'Clefable-Mega' }],
  'Crabominable': [{ stone: 'Crabominite', mega: 'Crabominable-Mega' }],
  'Delphox': [{ stone: 'Delphoxite', mega: 'Delphox-Mega' }],
  'Diancie': [{ stone: 'Diancite', mega: 'Diancie-Mega' }],
  'Dragonite': [{ stone: 'Dragoninite', mega: 'Dragonite-Mega' }],
  'Drampa': [{ stone: 'Drampanite', mega: 'Drampa-Mega' }],
  'Emboar': [{ stone: 'Emboarite', mega: 'Emboar-Mega' }],
  'Excadrill': [{ stone: 'Excadrite', mega: 'Excadrill-Mega' }],
  'Feraligatr': [{ stone: 'Feraligite', mega: 'Feraligatr-Mega' }],
  'Floette-Eternal': [{ stone: 'Floettite', mega: 'Floette-Mega' }],
  'Froslass': [{ stone: 'Froslassite', mega: 'Froslass-Mega' }],
  'Gallade': [{ stone: 'Galladite', mega: 'Gallade-Mega' }],
  'Garchomp': [{ stone: 'Garchompite', mega: 'Garchomp-Mega' }],
  'Gardevoir': [{ stone: 'Gardevoirite', mega: 'Gardevoir-Mega' }],
  'Gengar': [{ stone: 'Gengarite', mega: 'Gengar-Mega' }],
  'Glalie': [{ stone: 'Glalitite', mega: 'Glalie-Mega' }],
  'Glimmora': [{ stone: 'Glimmoranite', mega: 'Glimmora-Mega' }],
  'Golurk': [{ stone: 'Golurkite', mega: 'Golurk-Mega' }],
  'Greninja': [{ stone: 'Greninjite', mega: 'Greninja-Mega' }],
  'Gyarados': [{ stone: 'Gyaradosite', mega: 'Gyarados-Mega' }],
  'Hawlucha': [{ stone: 'Hawluchanite', mega: 'Hawlucha-Mega' }],
  'Heracross': [{ stone: 'Heracronite', mega: 'Heracross-Mega' }],
  'Houndoom': [{ stone: 'Houndoominite', mega: 'Houndoom-Mega' }],
  'Kangaskhan': [{ stone: 'Kangaskhanite', mega: 'Kangaskhan-Mega' }],
  'Latias': [{ stone: 'Latiasite', mega: 'Latias-Mega' }],
  'Latios': [{ stone: 'Latiosite', mega: 'Latios-Mega' }],
  'Lopunny': [{ stone: 'Lopunnite', mega: 'Lopunny-Mega' }],
  'Lucario': [{ stone: 'Lucarionite', mega: 'Lucario-Mega' }],
  'Magearna': [{ stone: 'Magearnite', mega: 'Magearna-Mega' }],
  'Malamar': [{ stone: 'Malamarite', mega: 'Malamar-Mega' }],
  'Manectric': [{ stone: 'Manectite', mega: 'Manectric-Mega' }],
  'Mawile': [{ stone: 'Mawilite', mega: 'Mawile-Mega' }],
  'Medicham': [{ stone: 'Medichamite', mega: 'Medicham-Mega' }],
  'Meganium': [{ stone: 'Meganiumite', mega: 'Meganium-Mega' }],
  'Meowstic': [{ stone: 'Meowsticite', mega: 'Meowstic-M-Mega' }],
  'Metagross': [{ stone: 'Metagrossite', mega: 'Metagross-Mega' }],
  'Mewtwo': [{ stone: 'Mewtwonite X', mega: 'Mewtwo-Mega-X' }, { stone: 'Mewtwonite Y', mega: 'Mewtwo-Mega-Y' }],
  'Pidgeot': [{ stone: 'Pidgeotite', mega: 'Pidgeot-Mega' }],
  'Pinsir': [{ stone: 'Pinsirite', mega: 'Pinsir-Mega' }],
  'Pyroar': [{ stone: 'Pyroarite', mega: 'Pyroar-Mega' }],
  'Sableye': [{ stone: 'Sablenite', mega: 'Sableye-Mega' }],
  'Salamence': [{ stone: 'Salamencite', mega: 'Salamence-Mega' }],
  'Sceptile': [{ stone: 'Sceptilite', mega: 'Sceptile-Mega' }],
  'Scizor': [{ stone: 'Scizorite', mega: 'Scizor-Mega' }],
  'Scolipede': [{ stone: 'Scolipite', mega: 'Scolipede-Mega' }],
  'Scovillain': [{ stone: 'Scovillainite', mega: 'Scovillain-Mega' }],
  'Scrafty': [{ stone: 'Scraftinite', mega: 'Scrafty-Mega' }],
  'Sharpedo': [{ stone: 'Sharpedonite', mega: 'Sharpedo-Mega' }],
  'Skarmory': [{ stone: 'Skarmorite', mega: 'Skarmory-Mega' }],
  'Slowbro': [{ stone: 'Slowbronite', mega: 'Slowbro-Mega' }],
  'Staraptor': [{ stone: 'Staraptite', mega: 'Staraptor-Mega' }],
  'Starmie': [{ stone: 'Starminite', mega: 'Starmie-Mega' }],
  'Steelix': [{ stone: 'Steelixite', mega: 'Steelix-Mega' }],
  'Swampert': [{ stone: 'Swampertite', mega: 'Swampert-Mega' }],
  'Tatsugiri': [{ stone: 'Tatsugirinite', mega: 'Tatsugiri-Curly-Mega' }],
  'Tyranitar': [{ stone: 'Tyranitarite', mega: 'Tyranitar-Mega' }],
  'Venusaur': [{ stone: 'Venusaurite', mega: 'Venusaur-Mega' }],
  'Victreebel': [{ stone: 'Victreebelite', mega: 'Victreebel-Mega' }],
  'Zeraora': [{ stone: 'Zeraorite', mega: 'Zeraora-Mega' }],
  'Zygarde-Complete': [{ stone: 'Zygardite', mega: 'Zygarde-Mega' }],
};

/** Look up the default mega stone for a species (first entry if multiple X/Y/Z variants) */
export function getMegaStone(species: string): string | null {
  return MEGA_STONE_MAP[species]?.[0]?.stone ?? null;
}

/** Get all mega stones for a species (for X/Y/Z variants) */
export function getMegaStones(species: string): MegaStoneEntry[] {
  return MEGA_STONE_MAP[species] ?? [];
}

/** Check if a species can mega evolve */
export function canMegaEvolve(species: string): boolean {
  return species in MEGA_STONE_MAP;
}
