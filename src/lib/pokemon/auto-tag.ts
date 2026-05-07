/**
 * Auto-generates strategy tags for a team based on its Pokemon sets.
 * Tags match TEAM_TAGS ids in template-teams.ts.
 */

interface PokemonSet {
  species?: string;
  ability?: string;
  moves?: string[];
  item?: string;
}

// Abilities that set weather/terrain/conditions
const WEATHER_SETTERS: Record<string, string> = {
  drought: 'weather-sun',
  drizzle: 'weather-rain',
  'sand stream': 'weather-sand',
  'snow warning': 'weather-snow',
  'primordial sea': 'weather-rain',
  'desolate land': 'weather-sun',
};

const TERRAIN_SETTERS: Record<string, string> = {
  'electric surge': 'terrain-electric',
  'psychic surge': 'terrain-psychic',
  'grassy surge': 'terrain-grassy',
  'misty surge': 'terrain-misty',
};

// Moves that indicate strategy
const TR_SETTERS = ['trick room'];
const TAILWIND_SETTERS = ['tailwind'];
const PERISH_MOVES = ['perish song'];
const WEATHER_MOVES: Record<string, string> = {
  'sunny day': 'weather-sun',
  'rain dance': 'weather-rain',
  sandstorm: 'weather-sand',
  snowscape: 'weather-snow',
  hail: 'weather-snow',
};

// Mega stone item suffix
const MEGA_STONE_RE = /ite$/i;
// Items that are Mega stones but don't follow the pattern
const MEGA_STONES_EXTRA = new Set([
  'gengarite', 'metagrossite', 'gyaradosite', 'charizardite x', 'charizardite y',
  'blazikenite', 'salamencite', 'gardevoirite', 'absolite', 'aerodactylite',
  'ampharosite', 'banettite', 'beedrillite', 'blastoisinite', 'cameruptite',
  'galladite', 'garchompite', 'glalitite', 'heracronite', 'houndoominite',
  'kangaskhanite', 'latiasite', 'latiosite', 'lopunnite', 'lucarionite',
  'manectite', 'mawilite', 'medichamite', 'pidgeotite', 'pinsirite',
  'sablenite', 'scizorite', 'sharpedonite', 'slowbronite', 'steelixite',
  'swampertite', 'tyranitarite', 'venusaurite', 'diancite', 'audinite',
  'froslassite', 'frostlassite', 'dragonite', // not a mega stone but just in case
  'excadrite', 'feraligatrite', 'clefablite',
]);

function normAbility(ability: string) {
  return ability.toLowerCase().trim();
}
function normMove(move: string) {
  return move.toLowerCase().trim();
}

export function autoTagTeam(pokemonSets: PokemonSet[]): string[] {
  const tags = new Set<string>();
  let hasTR = false;
  let hasTailwind = false;
  let hasMega = false;

  for (const p of pokemonSets) {
    // Check ability
    if (p.ability) {
      const ab = normAbility(p.ability);
      if (WEATHER_SETTERS[ab]) tags.add(WEATHER_SETTERS[ab]);
      if (TERRAIN_SETTERS[ab]) tags.add(TERRAIN_SETTERS[ab]);
      if (ab === 'commander') tags.add('commander');
    }

    // Check moves
    if (p.moves) {
      for (const m of p.moves) {
        const mv = normMove(m);
        if (TR_SETTERS.includes(mv)) hasTR = true;
        if (TAILWIND_SETTERS.includes(mv)) hasTailwind = true;
        if (PERISH_MOVES.includes(mv)) tags.add('perish-trap');
        if (WEATHER_MOVES[mv]) tags.add(WEATHER_MOVES[mv]);
      }
    }

    // Check item for Mega stone
    if (p.item) {
      const it = p.item.toLowerCase().trim();
      if (MEGA_STONE_RE.test(it) || MEGA_STONES_EXTRA.has(it)) {
        hasMega = true;
      }
    }
  }

  if (hasTR) tags.add('trick-room');
  if (hasTailwind) tags.add('tailwind');
  if (hasMega) tags.add('mega-focused');

  return Array.from(tags);
}
