/**
 * Pokemon playstyle/role tags for search filtering and team analysis.
 *
 * These tags serve dual purposes:
 * 1. Pokemon-level: assigned to individual species based on their common competitive usage
 * 2. Team-level: detected from team composition (see team-tags.ts)
 *
 * FORMAT UPDATE PIPELINE:
 * When a new format drops, follow these steps to update tags:
 * 1. Update the roster in scripts/seed-formats.ts (add/remove Pokemon)
 * 2. Run `pnpm seed:formats` to update the DB
 * 3. Review POKEMON_ROLE_TAGS below — add new Pokemon, reassign tags based on meta
 * 4. Check usage data from Pikalytics/Champions Lab for role shifts
 * 5. Update DEFAULT_META_THREATS in src/types/calc.ts
 * 6. Run `pnpm build` to verify everything compiles
 */

/** All available playstyle tags with display info */
export interface PlaystyleTag {
  id: string;
  label: string;
  category: 'offense' | 'support' | 'defense' | 'speed-control' | 'weather' | 'archetype';
  description: string;
}

export const PLAYSTYLE_TAGS: PlaystyleTag[] = [
  // Offense
  { id: 'physical-sweeper', label: 'Physical Sweeper', category: 'offense', description: 'Fast physical attacker with high Atk and Spe' },
  { id: 'special-sweeper', label: 'Special Sweeper', category: 'offense', description: 'Fast special attacker with high SpA and Spe' },
  { id: 'bulky-physical', label: 'Bulky Physical', category: 'offense', description: 'Tanky physical attacker, trades speed for bulk' },
  { id: 'bulky-special', label: 'Bulky Special', category: 'offense', description: 'Tanky special attacker, trades speed for bulk' },
  { id: 'wallbreaker', label: 'Wallbreaker', category: 'offense', description: 'Hits extremely hard to break through defensive Pokemon' },
  { id: 'setup-sweeper', label: 'Setup Sweeper', category: 'offense', description: 'Uses boosting moves (Swords Dance, Calm Mind, etc.) then sweeps' },
  { id: 'priority-user', label: 'Priority User', category: 'offense', description: 'Relies on priority moves (Extreme Speed, Bullet Punch, etc.)' },
  { id: 'spread-attacker', label: 'Spread Attacker', category: 'offense', description: 'Uses spread moves (Earthquake, Heat Wave, Rock Slide, etc.)' },

  // Support
  { id: 'fake-out', label: 'Fake Out', category: 'support', description: 'Leads with Fake Out for flinch pressure and positioning' },
  { id: 'redirector', label: 'Redirector', category: 'support', description: 'Uses Follow Me or Rage Powder to redirect attacks' },
  { id: 'intimidate', label: 'Intimidate', category: 'support', description: 'Has Intimidate to lower opponent Attack on switch-in' },
  { id: 'screens-setter', label: 'Screens Setter', category: 'support', description: 'Sets Light Screen, Reflect, or Aurora Veil' },
  { id: 'support-pivot', label: 'Support Pivot', category: 'support', description: 'Switches often with U-turn/Parting Shot/Volt Switch for momentum' },
  { id: 'status-spreader', label: 'Status Spreader', category: 'support', description: 'Spreads burns, paralysis, or sleep' },
  { id: 'healer', label: 'Healer', category: 'support', description: 'Provides team healing (Life Dew, Heal Pulse, Wish)' },
  { id: 'friend-guard', label: 'Friend Guard', category: 'support', description: 'Reduces damage to ally with Friend Guard ability' },

  // Defense
  { id: 'physical-wall', label: 'Physical Wall', category: 'defense', description: 'High physical bulk, takes physical hits' },
  { id: 'special-wall', label: 'Special Wall', category: 'defense', description: 'High special bulk, takes special hits' },

  // Speed Control
  { id: 'tailwind-setter', label: 'Tailwind Setter', category: 'speed-control', description: 'Sets Tailwind to double team speed for 4 turns' },
  { id: 'trick-room-setter', label: 'Trick Room Setter', category: 'speed-control', description: 'Sets Trick Room so slower Pokemon move first' },
  { id: 'trick-room-sweeper', label: 'TR Sweeper', category: 'speed-control', description: 'Very slow, designed to sweep under Trick Room' },
  { id: 'speed-control', label: 'Speed Control', category: 'speed-control', description: 'Uses Icy Wind, Thunder Wave, or Electroweb' },

  // Weather
  { id: 'weather-setter', label: 'Weather Setter', category: 'weather', description: 'Sets weather via ability (Drought, Drizzle, etc.)' },
  { id: 'weather-abuser', label: 'Weather Abuser', category: 'weather', description: 'Benefits from weather (Chlorophyll, Swift Swim, Sand Rush, etc.)' },

  // Archetype
  { id: 'mega-evolution', label: 'Mega Evolution', category: 'archetype', description: 'Mega Evolves in battle via held Mega Stone' },
  { id: 'trapper', label: 'Trapper', category: 'archetype', description: 'Traps opponents (Shadow Tag, Arena Trap, Mean Look)' },
];

export const PLAYSTYLE_TAG_MAP = Object.fromEntries(PLAYSTYLE_TAGS.map(t => [t.id, t]));

/**
 * Pokemon role assignments — maps species to their common competitive playstyle tags.
 *
 * This is the primary place to update when:
 * - A new format drops and Pokemon shift roles
 * - New Pokemon are added to the roster
 * - Meta shifts cause role changes (e.g., a sweeper becomes a support)
 *
 * Multiple tags per Pokemon are encouraged — many Pokemon fill multiple roles.
 */
export const POKEMON_ROLE_TAGS: Record<string, string[]> = {
  // === Core Meta (tournament top usage) ===
  'Incineroar': ['fake-out', 'intimidate', 'support-pivot'],
  'Sneasler': ['fake-out', 'physical-sweeper'],
  'Garchomp': ['physical-sweeper', 'spread-attacker'],
  'Kingambit': ['bulky-physical', 'priority-user'],
  'Sinistcha': ['redirector', 'healer', 'trick-room-setter'],
  'Charizard': ['special-sweeper', 'spread-attacker', 'mega-evolution', 'weather-setter'],
  'Whimsicott': ['tailwind-setter', 'support-pivot'],
  'Basculegion': ['physical-sweeper', 'weather-abuser'],
  'Archaludon': ['bulky-special', 'weather-abuser'],
  'Pelipper': ['weather-setter', 'tailwind-setter'],
  'Rotom-Wash': ['bulky-special', 'status-spreader', 'support-pivot'],
  'Rotom': ['bulky-special', 'status-spreader', 'support-pivot'],
  'Gardevoir': ['special-sweeper', 'trick-room-setter', 'spread-attacker', 'mega-evolution'],
  'Maushold': ['friend-guard'],
  'Tyranitar': ['weather-setter', 'bulky-physical', 'spread-attacker'],
  'Excadrill': ['physical-sweeper', 'weather-abuser', 'spread-attacker'],
  'Froslass': ['screens-setter', 'weather-setter', 'mega-evolution'],
  'Gengar': ['special-sweeper', 'trapper', 'mega-evolution'],
  'Dragonite': ['bulky-physical', 'priority-user', 'setup-sweeper'],
  'Arcanine-Hisui': ['intimidate', 'physical-sweeper', 'spread-attacker'],
  'Floette': ['healer', 'mega-evolution'],
  'Hydreigon': ['special-sweeper', 'wallbreaker'],
  'Primarina': ['bulky-special', 'spread-attacker'],
  'Farigiraf': ['trick-room-setter', 'bulky-special'],
  'Kommo-o': ['physical-wall', 'setup-sweeper'],
  'Meganium': ['weather-setter', 'mega-evolution', 'bulky-special'],
  'Sylveon': ['bulky-special', 'spread-attacker'],
  'Torkoal': ['weather-setter', 'trick-room-sweeper', 'spread-attacker'],

  // === Secondary Meta ===
  'Dragapult': ['special-sweeper', 'physical-sweeper', 'speed-control'],
  'Volcarona': ['setup-sweeper', 'special-sweeper', 'spread-attacker'],
  'Scizor': ['priority-user', 'setup-sweeper', 'mega-evolution'],
  'Corviknight': ['physical-wall', 'tailwind-setter'],
  'Hatterene': ['trick-room-setter', 'special-sweeper'],
  'Mimikyu': ['trick-room-setter', 'physical-sweeper'],
  'Arcanine': ['intimidate', 'status-spreader', 'bulky-physical'],
  'Slowking': ['trick-room-setter', 'bulky-special'],
  'Venusaur': ['weather-abuser', 'special-sweeper', 'spread-attacker'],
  'Talonflame': ['tailwind-setter', 'physical-sweeper', 'priority-user'],
  'Greninja': ['special-sweeper', 'physical-sweeper'],
  'Lucario': ['physical-sweeper', 'special-sweeper', 'mega-evolution'],
  'Weavile': ['physical-sweeper', 'fake-out'],
  'Blastoise': ['spread-attacker', 'mega-evolution', 'weather-abuser'],
  'Aegislash': ['bulky-physical', 'special-sweeper', 'trick-room-sweeper'],
  'Clefable': ['redirector', 'friend-guard', 'healer'],
  'Mamoswine': ['physical-sweeper', 'priority-user', 'spread-attacker'],
  'Dondozo': ['physical-wall'],
  'Tatsugiri': ['redirector'],
  'Grimmsnarl': ['screens-setter', 'fake-out', 'status-spreader'],
  'Amoonguss': ['redirector', 'status-spreader'],
  'Ninetales-Alola': ['weather-setter', 'screens-setter', 'special-sweeper'],
  'Palafin': ['physical-sweeper', 'priority-user'],
  'Tsareena': ['physical-sweeper', 'fake-out'],
  'Zoroark-Hisui': ['special-sweeper'],
  'Chandelure': ['special-sweeper', 'trick-room-sweeper', 'spread-attacker'],
  'Gyarados': ['setup-sweeper', 'intimidate', 'mega-evolution'],
  'Feraligatr': ['physical-sweeper', 'setup-sweeper', 'mega-evolution'],
  'Swampert': ['weather-abuser', 'physical-sweeper', 'mega-evolution'],
  'Lopunny': ['fake-out', 'physical-sweeper', 'mega-evolution'],
  'Alakazam': ['special-sweeper', 'mega-evolution'],
  'Aerodactyl': ['tailwind-setter', 'spread-attacker', 'mega-evolution'],
};
