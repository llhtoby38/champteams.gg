import type { PokemonSet, StatsTable } from '@/types/pokemon';

export interface TeamTemplate {
  id: string;
  name: string;
  description: string;
  archetype: string;
  tags: string[];
  format: string;
  pokemon: PokemonSet[];
  author?: string;
  source?: string;
}

/** Stat Points helper — Champions uses SP (0-32 per stat, 66 total) */
const sp = (hp = 0, atk = 0, def = 0, spa = 0, spd = 0, spe = 0): StatsTable => ({ hp, atk, def, spa, spd, spe });
/** IVs are always 31 in Champions */
const ivs31: StatsTable = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

/**
 * Pre-built template teams for Pokemon Champions Reg M-A.
 *
 * HOW TO UPDATE:
 * 1. Research winning teams from Limitless VGC, Victory Road, YouTube
 * 2. Add new TeamTemplate entries below
 * 3. Each needs: id, name, description, archetype, tags, format, 6 pokemon
 * 4. Changes take effect on next build/deploy
 */
export const TEMPLATE_TEAMS: TeamTemplate[] = [
  // ═══════════════════════════════════════════════════════
  // 1. SAND OFFENSE — Tyranitar + Excadrill core
  // ═══════════════════════════════════════════════════════
  {
    id: 'sand-offense',
    name: 'Sand Rush Offense',
    description: 'Tyranitar sets sandstorm, Excadrill doubles its speed via Sand Rush. Garchomp provides additional Ground coverage. Whimsicott offers Tailwind as backup speed control.',
    archetype: 'Weather (Sand)',
    tags: ['weather-sand', 'hyper-offense', 'mega-focused'],
    format: 'season-m1',
    pokemon: [
      { species: 'Tyranitar', item: 'Assault Vest', ability: 'Sand Stream', moves: ['Rock Slide', 'Crunch', 'Low Kick', 'Ice Punch'], nature: 'Adamant', evs: sp(32, 32, 0, 0, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Excadrill', item: 'Focus Sash', ability: 'Sand Rush', moves: ['High Horsepower', 'Iron Head', 'Rock Slide', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', moves: ['Earthquake', 'Dragon Claw', 'Rock Slide', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Tailwind', 'Moonblast', 'Encore', 'Helping Hand'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Safety Goggles', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'], nature: 'Careful', evs: sp(32, 2, 0, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Sylveon', item: 'Throat Spray', ability: 'Pixilate', moves: ['Hyper Voice', 'Mystical Fire', 'Calm Mind', 'Protect'], nature: 'Modest', evs: sp(32, 0, 2, 32, 0, 0), ivs: ivs31, level: 50 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 2. RAIN CORE — Pelipper + Archaludon + Basculegion
  // ═══════════════════════════════════════════════════════
  {
    id: 'rain-offense',
    name: 'Rain Rush',
    description: 'Pelipper sets rain and provides Tailwind. Archaludon abuses Electro Shot (charges instantly in rain). Basculegion sweeps with Swift Swim-boosted Wave Crash.',
    archetype: 'Weather (Rain)',
    tags: ['weather-rain', 'tailwind', 'hyper-offense'],
    format: 'season-m1',
    pokemon: [
      { species: 'Pelipper', item: 'Focus Sash', ability: 'Drizzle', moves: ['Hurricane', 'Weather Ball', 'Tailwind', 'Protect'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Archaludon', item: 'Assault Vest', ability: 'Stamina', moves: ['Flash Cannon', 'Electro Shot', 'Body Press', 'Dragon Pulse'], nature: 'Modest', evs: sp(32, 0, 2, 32, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Basculegion', item: 'Choice Band', ability: 'Swift Swim', moves: ['Wave Crash', 'Last Respects', 'Aqua Jet', 'Phantom Force'], nature: 'Adamant', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Black Glasses', ability: 'Defiant', moves: ['Sucker Punch', 'Iron Head', 'Kowtow Cleave', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Grimmsnarl', item: 'Light Clay', ability: 'Prankster', moves: ['Reflect', 'Light Screen', 'Spirit Break', 'Thunder Wave'], nature: 'Careful', evs: sp(32, 0, 2, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Loaded Dice', ability: 'Rough Skin', moves: ['Scale Shot', 'Earthquake', 'Rock Slide', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 3. SUN + TRICK ROOM — Torkoal + Venusaur + Hatterene
  // ═══════════════════════════════════════════════════════
  {
    id: 'sun-trick-room',
    name: 'Sun Room',
    description: 'Dual-mode team: fast Chlorophyll Venusaur in sun, or slow Trick Room Torkoal Eruption spam. Hatterene sets TR with Magic Bounce blocking Taunt.',
    archetype: 'Weather (Sun) + Trick Room',
    tags: ['weather-sun', 'trick-room', 'semi-trick-room'],
    format: 'season-m1',
    pokemon: [
      { species: 'Torkoal', item: 'Charcoal', ability: 'Drought', moves: ['Eruption', 'Heat Wave', 'Earth Power', 'Protect'], nature: 'Quiet', evs: sp(32, 0, 2, 32, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Venusaur', item: 'Life Orb', ability: 'Chlorophyll', moves: ['Giga Drain', 'Sludge Bomb', 'Earth Power', 'Protect'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Hatterene', item: 'Leftovers', ability: 'Magic Bounce', moves: ['Trick Room', 'Dazzling Gleam', 'Psychic', 'Mystical Fire'], nature: 'Quiet', evs: sp(32, 0, 2, 32, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Safety Goggles', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'], nature: 'Careful', evs: sp(32, 2, 0, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Dragapult', item: 'Choice Specs', ability: 'Clear Body', moves: ['Shadow Ball', 'Draco Meteor', 'Flamethrower', 'Thunderbolt'], nature: 'Timid', evs: sp(0, 0, 2, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Arcanine', item: 'Sitrus Berry', ability: 'Intimidate', moves: ['Flare Blitz', 'Extreme Speed', 'Snarl', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 4. TAILWIND HYPER OFFENSE — Whimsicott + sweepers
  // ═══════════════════════════════════════════════════════
  {
    id: 'tailwind-offense',
    name: 'Tailwind Blitz',
    description: 'Whimsicott sets Prankster Tailwind turn 1. Garchomp and Hydreigon unleash spread damage. Incineroar provides Fake Out support for safe Tailwind.',
    archetype: 'Tailwind Offense',
    tags: ['tailwind', 'hyper-offense'],
    format: 'season-m1',
    pokemon: [
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Tailwind', 'Moonblast', 'Encore', 'Helping Hand'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', moves: ['Earthquake', 'Dragon Claw', 'Rock Slide', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Hydreigon', item: 'Choice Specs', ability: 'Levitate', moves: ['Dark Pulse', 'Draco Meteor', 'Flamethrower', 'Earth Power'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Sitrus Berry', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Metagross', item: 'Clear Amulet', ability: 'Clear Body', moves: ['Iron Head', 'Zen Headbutt', 'Ice Punch', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Milotic', item: 'Leftovers', ability: 'Competitive', moves: ['Muddy Water', 'Ice Beam', 'Recover', 'Protect'], nature: 'Bold', evs: sp(32, 0, 32, 2, 0, 0), ivs: ivs31, level: 50 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 5. BALANCED GOODSTUFFS — Incineroar + Garchomp
  // ═══════════════════════════════════════════════════════
  {
    id: 'balanced-goodstuffs',
    name: 'Champion Goodstuffs',
    description: 'Individually strong Pokemon with great synergy. Incineroar Intimidate cycling, Garchomp spread damage, Whimsicott Tailwind, Kingambit Defiant punishes Intimidate.',
    archetype: 'Balanced / Goodstuffs',
    tags: ['balanced', 'goodstuffs'],
    format: 'season-m1',
    pokemon: [
      { species: 'Incineroar', item: 'Safety Goggles', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'], nature: 'Careful', evs: sp(32, 2, 0, 0, 30, 2), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', moves: ['Earthquake', 'Dragon Claw', 'Rock Slide', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Assault Vest', ability: 'Defiant', moves: ['Sucker Punch', 'Iron Head', 'Kowtow Cleave', 'Low Kick'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Tailwind', 'Moonblast', 'Encore', 'Taunt'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Dragapult', item: 'Choice Specs', ability: 'Clear Body', moves: ['Shadow Ball', 'Draco Meteor', 'Thunderbolt', 'Flamethrower'], nature: 'Timid', evs: sp(0, 0, 2, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Corviknight', item: 'Leftovers', ability: 'Mirror Armor', moves: ['Body Press', 'Brave Bird', 'Iron Head', 'Roost'], nature: 'Impish', evs: sp(32, 0, 32, 0, 2, 0), ivs: ivs31, level: 50 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 6. MEGA METAGROSS — Steel/Psychic powerhouse
  // ═══════════════════════════════════════════════════════
  {
    id: 'mega-metagross',
    name: 'Steel Surge (Mega Metagross)',
    description: 'Mega Metagross is the centerpiece — Tough Claws boosts contact moves. Incineroar Fake Out protects Mega turn. Whimsicott Tailwind ensures Metagross outspeeds.',
    archetype: 'Mega-Focused',
    tags: ['mega-focused', 'tailwind', 'bulky-offense'],
    format: 'season-m1',
    pokemon: [
      { species: 'Metagross', item: 'Metagrossite', ability: 'Clear Body', moves: ['Iron Head', 'Zen Headbutt', 'Ice Punch', 'Protect'], nature: 'Jolly', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Sitrus Berry', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Tailwind', 'Moonblast', 'Encore', 'Helping Hand'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', moves: ['Earthquake', 'Dragon Claw', 'Rock Slide', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Hydreigon', item: 'Choice Specs', ability: 'Levitate', moves: ['Dark Pulse', 'Draco Meteor', 'Flamethrower', 'Earth Power'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Grimmsnarl', item: 'Light Clay', ability: 'Prankster', moves: ['Reflect', 'Light Screen', 'Spirit Break', 'Thunder Wave'], nature: 'Careful', evs: sp(32, 0, 2, 0, 32, 0), ivs: ivs31, level: 50 },
    ],
  },
  // ═══════════════════════════════════════════════════════
  // 7. MEGA FROSLASS SNOW — Highest WR Mega (63.8%)
  // ═══════════════════════════════════════════════════════
  {
    id: 'mega-froslass-snow',
    name: 'Aurora Veil (Mega Froslass)',
    description: 'Mega Froslass summons Snow via Snow Warning, enabling Aurora Veil (halves all damage for 5 turns) and guaranteed Blizzard. Dragonite sweeps behind the Veil with Multiscale + Dragon Dance.',
    archetype: 'Weather (Snow) + Mega',
    tags: ['weather-snow', 'mega-focused', 'bulky-offense'],
    format: 'season-m1',
    source: 'Champions Lab (63.8% WR Mega Froslass)',
    pokemon: [
      { species: 'Froslass', item: 'Frostlassite', ability: 'Cursed Body', moves: ['Blizzard', 'Shadow Ball', 'Aurora Veil', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Dragonite', item: 'Lum Berry', ability: 'Inner Focus', moves: ['Dragon Claw', 'Extreme Speed', 'Dragon Dance', 'Protect'], nature: 'Adamant', evs: sp(21, 32, 3, 0, 0, 10), ivs: ivs31, level: 50 },
      { species: 'Chesnaught', item: 'Assault Vest', ability: 'Bulletproof', moves: ['Drain Punch', 'Wood Hammer', 'Stone Edge', 'Spiky Shield'], nature: 'Careful', evs: sp(32, 2, 0, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Black Glasses', ability: 'Defiant', moves: ['Sucker Punch', 'Iron Head', 'Kowtow Cleave', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Sitrus Berry', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Parting Shot', 'Helping Hand'], nature: 'Careful', evs: sp(32, 1, 15, 0, 13, 5), ivs: ivs31, level: 50 },
      { species: 'Primarina', item: 'Choice Specs', ability: 'Liquid Voice', moves: ['Hyper Voice', 'Moonblast', 'Ice Beam', 'Energy Ball'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // 8. DONDOZO + TATSUGIRI COMMANDER — 58.6% core WR
  // ═══════════════════════════════════════════════════════
  {
    id: 'commander-team',
    name: 'Commander Combo (Dondozo + Tatsugiri)',
    description: 'Tatsugiri activates Commander when Dondozo is on the field, boosting all of Dondozo\'s stats by +2. Dondozo becomes an unkillable sweeper. Grimmsnarl screens protect the setup.',
    archetype: 'Commander Gimmick',
    tags: ['balanced', 'bulky-offense'],
    format: 'season-m1',
    source: 'Champions Lab (58.6% core WR)',
    pokemon: [
      { species: 'Dondozo', item: 'Leftovers', ability: 'Unaware', moves: ['Wave Crash', 'Order Up', 'Protect', 'Earthquake'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Tatsugiri', item: 'Focus Sash', ability: 'Commander', moves: ['Draco Meteor', 'Muddy Water', 'Icy Wind', 'Protect'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Grimmsnarl', item: 'Light Clay', ability: 'Prankster', moves: ['Reflect', 'Light Screen', 'Spirit Break', 'Fake Out'], nature: 'Careful', evs: sp(32, 0, 2, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', moves: ['Earthquake', 'Dragon Claw', 'Rock Slide', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Safety Goggles', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'], nature: 'Careful', evs: sp(32, 2, 0, 0, 30, 2), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Tailwind', 'Moonblast', 'Encore', 'Helping Hand'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // COMMUNITY TEAMS (from VGC Pre-Champions spreadsheet)
  // ═══════════════════════════════════════════════════════

  // 9. Charizard-Y Sun Room — Joseph Ugarte
  {
    id: 'community-sun-room',
    name: 'Sun Room (Charizard-Y)',
    description: 'Charizard-Y provides Drought + Tailwind. Venusaur Chlorophyll sweeper. Farigiraf Armor Tail TR setter. Ursaluna Guts under TR.',
    archetype: 'Weather (Sun) + Trick Room',
    tags: ['weather-sun', 'trick-room', 'semi-trick-room'],
    format: 'season-m1',
    author: 'Joseph Ugarte',
    source: 'https://youtu.be/DAwnCskX_uI',
    pokemon: [
      { species: 'Charizard', item: 'Charizardite Y', ability: 'Blaze', moves: ['Heat Wave', 'Overheat', 'Tailwind', 'Protect'], nature: 'Timid', evs: sp(22, 0, 5, 15, 1, 23), ivs: ivs31, level: 50 },
      { species: 'Venusaur', item: 'Focus Sash', ability: 'Chlorophyll', moves: ['Energy Ball', 'Sludge Bomb', 'Sleep Powder', 'Protect'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Farigiraf', item: 'Throat Spray', ability: 'Armor Tail', moves: ['Psychic', 'Hyper Voice', 'Trick Room', 'Protect'], nature: 'Modest', evs: sp(12, 0, 6, 20, 13, 15), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Assault Vest', ability: 'Intimidate', moves: ['Flare Blitz', 'Darkest Lariat', 'U-turn', 'Fake Out'], nature: 'Adamant', evs: sp(32, 15, 1, 0, 1, 17), ivs: ivs31, level: 50 },
      { species: 'Ursaluna', item: 'Flame Orb', ability: 'Guts', moves: ['Facade', 'Headlong Rush', 'Earthquake', 'Protect'], nature: 'Adamant', evs: sp(18, 20, 1, 0, 1, 26), ivs: ivs31, level: 50 },
      { species: 'Torkoal', item: 'Charcoal', ability: 'Drought', moves: ['Eruption', 'Heat Wave', 'Weather Ball', 'Protect'], nature: 'Quiet', evs: sp(32, 0, 0, 32, 2, 0), ivs: ivs31, level: 50 },
    ],
  },

  // 10. Mega Froslass — Eric Rios
  {
    id: 'community-froslass',
    name: 'Aurora Veil Froslass',
    description: 'Mega Froslass Snow Warning + Aurora Veil. Kingambit Defiant. Sneasler Fake Out + Coaching. Garganacl Wide Guard + Salt Cure stall.',
    archetype: 'Weather (Snow) + Mega',
    tags: ['weather-snow', 'mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Eric Rios',
    source: 'https://x.com/riopaser/status/2040079900774703599',
    pokemon: [
      { species: 'Froslass', item: 'Froslassite', ability: 'Cursed Body', moves: ['Aurora Veil', 'Blizzard', 'Shadow Ball', 'Protect'], nature: 'Timid', evs: sp(26, 0, 1, 9, 15, 15), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Chople Berry', ability: 'Defiant', moves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Protect'], nature: 'Adamant', evs: sp(32, 19, 14, 0, 1, 0), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'Focus Sash', ability: 'Unburden', moves: ['Fake Out', 'Close Combat', 'Dire Claw', 'Coaching'], nature: 'Jolly', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Choice Scarf', ability: 'Rough Skin', moves: ['Stomping Tantrum', 'Dragon Claw', 'Rock Slide', 'Bulldoze'], nature: 'Adamant', evs: sp(6, 27, 0, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Garganacl', item: 'Leftovers', ability: 'Purifying Salt', moves: ['Protect', 'Wide Guard', 'Salt Cure', 'Recover'], nature: 'Careful', evs: sp(32, 1, 1, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Rotom', item: 'Sitrus Berry', ability: 'Levitate', moves: ['Hydro Pump', 'Will-O-Wisp', 'Protect', 'Thunderbolt'], nature: 'Bold', evs: sp(32, 0, 11, 1, 10, 12), ivs: ivs31, level: 50 },
    ],
  },

  // 11. Mega Tyranitar Sand — Lucky Wolf
  {
    id: 'community-tyranitar-sand',
    name: 'Mega Tyranitar Sand',
    description: 'Mega Tyranitar as sand setter + physical tank. Excadrill Sand Rush sweeper. Corviknight Tailwind + Bulk Up. Sinistcha support.',
    archetype: 'Weather (Sand) + Mega',
    tags: ['weather-sand', 'mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Lucky Wolf',
    source: 'https://www.youtube.com/watch?v=zWs8I4vvLCk',
    pokemon: [
      { species: 'Tyranitar', item: 'Tyranitarite', ability: 'Sand Stream', moves: ['Rock Slide', 'Low Kick', 'Knock Off', 'Protect'], nature: 'Adamant', evs: sp(31, 16, 1, 0, 1, 17), ivs: ivs31, level: 50 },
      { species: 'Corviknight', item: 'Leftovers', ability: 'Mirror Armor', moves: ['Body Press', 'Tailwind', 'Bulk Up', 'Brave Bird'], nature: 'Adamant', evs: sp(31, 13, 2, 0, 1, 19), ivs: ivs31, level: 50 },
      { species: 'Rotom', item: 'Sitrus Berry', ability: 'Levitate', moves: ['Will-O-Wisp', 'Hydro Pump', 'Protect', 'Thunderbolt'], nature: 'Modest', evs: sp(31, 0, 2, 31, 1, 1), ivs: ivs31, level: 50 },
      { species: 'Excadrill', item: 'Focus Sash', ability: 'Sand Rush', moves: ['High Horsepower', 'Iron Head', 'Earth Power', 'Protect'], nature: 'Adamant', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Safety Goggles', ability: 'Intimidate', moves: ['Fake Out', 'Darkest Lariat', 'Flare Blitz', 'Parting Shot'], nature: 'Adamant', evs: sp(32, 5, 1, 0, 2, 26), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Rocky Helmet', ability: 'Hospitality', moves: ['Rage Powder', 'Matcha Gotcha', 'Strength Sap', 'Life Dew'], nature: 'Modest', evs: sp(26, 0, 28, 9, 3, 0), ivs: ivs31, level: 50 },
    ],
  },

  // 12. Mega Falinks — Phillip Wingett
  {
    id: 'community-falinks',
    name: 'No Retreat Falinks',
    description: 'Mega Falinks No Retreat + Body Press combo. Vivillon Friend Guard + Rage Powder redirector. Sableye Prankster Screens. Creative and fun!',
    archetype: 'Setup Sweeper',
    tags: ['mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Phillip Wingett',
    source: 'https://youtu.be/2lbA3aAuUOQ',
    pokemon: [
      { species: 'Falinks', item: 'Falinksite', ability: 'Defiant', moves: ['Protect', 'No Retreat', 'Body Press', 'Rock Slide'], nature: 'Impish', evs: sp(32, 0, 25, 0, 8, 1), ivs: ivs31, level: 50 },
      { species: 'Vivillon', item: 'Focus Sash', ability: 'Friend Guard', moves: ['Tailwind', 'Rage Powder', 'Sleep Powder', 'Pollen Puff'], nature: 'Timid', evs: sp(32, 0, 1, 1, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Sableye', item: 'Light Clay', ability: 'Prankster', moves: ['Light Screen', 'Reflect', 'Fake Out', 'Encore'], nature: 'Careful', evs: sp(32, 0, 8, 0, 25, 1), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Eject Button', ability: 'Hospitality', moves: ['Protect', 'Life Dew', 'Rage Powder', 'Matcha Gotcha'], nature: 'Calm', evs: sp(32, 0, 0, 1, 30, 3), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Assault Vest', ability: 'Intimidate', moves: ['Fake Out', 'U-turn', 'Darkest Lariat', 'Flare Blitz'], nature: 'Adamant', evs: sp(32, 25, 0, 0, 3, 6), ivs: ivs31, level: 50 },
      { species: 'Clefable', item: 'Sitrus Berry', ability: 'Unaware', moves: ['Follow Me', 'Psych Up', 'Moonlight', 'Moonblast'], nature: 'Bold', evs: sp(32, 0, 27, 0, 1, 6), ivs: ivs31, level: 50 },
    ],
  },

  // ── Matt Bruno & Ashton Cox ──────────────────────────────
  {
    id: 'community-drampa-tr',
    name: 'Mega Drampa Trick Room',
    description: 'Mega Drampa Cloud Nine + Hyper Voice spam. Farigiraf Armor Tail sets TR. Conkeldurr Guts Flame Orb + Kingambit Defiant finish.',
    archetype: 'Trick Room',
    tags: ['trick-room', 'mega-focused'],
    format: 'season-m1',
    author: 'Matt Bruno & Ashton Cox',
    source: 'https://youtu.be/n4mnyOUdW_g',
    pokemon: [
      { species: 'Drampa', item: 'Drampanite', ability: 'Cloud Nine', moves: ['Hyper Voice', 'Hurricane', 'Dragon Pulse', 'Protect'], nature: 'Quiet', evs: sp(32, 0, 1, 32, 1, 0), ivs: ivs31, level: 50 },
      { species: 'Blastoise', item: 'Choice Scarf', ability: 'Torrent', moves: ['Water Spout', 'Hydro Pump', 'Flip Turn', 'Icy Wind'], nature: 'Modest', evs: sp(1, 0, 1, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Farigiraf', item: 'Sitrus Berry', ability: 'Armor Tail', moves: ['Hyper Voice', 'Helping Hand', 'Trick Room', 'Protect'], nature: 'Calm', evs: sp(32, 0, 23, 2, 9, 0), ivs: ivs31, level: 50 },
      { species: 'Alcremie', item: 'Iron Ball', ability: 'Aroma Veil', moves: ['Dazzling Gleam', 'Decorate', 'Encore', 'Protect'], nature: 'Bold', evs: sp(32, 0, 19, 2, 13, 0), ivs: ivs31, level: 50 },
      { species: 'Conkeldurr', item: 'Flame Orb', ability: 'Guts', moves: ['Drain Punch', 'Mach Punch', 'Knock Off', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 1, 0, 1, 0), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Assault Vest', ability: 'Defiant', moves: ['Kowtow Cleave', 'Sucker Punch', 'Iron Head', 'Assurance'], nature: 'Adamant', evs: sp(32, 32, 1, 0, 1, 0), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-mattbruno-feraligatr',
    name: 'Feraligatr-M Speed Control',
    description: 'Mega Feraligatr Sheer Force + Liquidation. Arcanine-H Intimidate. Corviknight Tailwind. Dragonite Scale Shot + Extreme Speed cleanup.',
    archetype: 'Mega-Focused + Tailwind',
    tags: ['mega-focused', 'tailwind', 'balanced'],
    format: 'season-m1',
    author: 'Matt Bruno & Ashton Cox',
    source: 'https://youtu.be/kbt_LswCyso',
    pokemon: [
      { species: 'Feraligatr', item: 'Feraligite', ability: 'Sheer Force', moves: ['Double-Edge', 'Liquidation', 'Roar', 'Protect'], nature: 'Adamant', evs: sp(23, 11, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Arcanine-Hisui', item: 'Clear Amulet', ability: 'Intimidate', moves: ['Flare Blitz', 'Rock Slide', 'Howl', 'Protect'], nature: 'Adamant', evs: sp(13, 32, 0, 0, 0, 21), ivs: ivs31, level: 50 },
      { species: 'Meowscarada', item: 'Focus Sash', ability: 'Overgrow', moves: ['Flower Trick', 'Sucker Punch', 'Toxic Spikes', 'Protect'], nature: 'Jolly', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Clefable', item: 'Sitrus Berry', ability: 'Unaware', moves: ['Moonblast', 'Thunder Wave', 'Follow Me', 'Protect'], nature: 'Bold', evs: sp(32, 0, 20, 0, 14, 0), ivs: ivs31, level: 50 },
      { species: 'Corviknight', item: 'Leftovers', ability: 'Mirror Armor', moves: ['Brave Bird', 'Roost', 'Tailwind', 'Protect'], nature: 'Impish', evs: sp(29, 2, 32, 0, 0, 3), ivs: ivs31, level: 50 },
      { species: 'Dragonite', item: 'Loaded Dice', ability: 'Multiscale', moves: ['Scale Shot', 'Extreme Speed', 'Iron Head', 'Protect'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-mattbruno-clefable-sand',
    name: 'Mega Clefable Sand',
    description: 'Mega Clefable Follow Me redirector + special attacker. Tyranitar sand + Excadrill Sand Rush sweeper. Dragapult Choice Band Dragon Darts.',
    archetype: 'Weather (Sand) + Mega',
    tags: ['weather-sand', 'mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Matt Bruno & Ashton Cox',
    source: 'https://youtu.be/IgeS6rmw_z4',
    pokemon: [
      { species: 'Clefable', item: 'Clefablite', ability: 'Unaware', moves: ['Dazzling Gleam', 'Air Slash', 'Follow Me', 'Protect'], nature: 'Modest', evs: sp(32, 0, 0, 32, 0, 2), ivs: ivs31, level: 50 },
      { species: 'Dragapult', item: 'Choice Band', ability: 'Clear Body', moves: ['Dragon Darts', 'Phantom Force', 'Outrage', 'U-turn'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Excadrill', item: 'Focus Sash', ability: 'Sand Rush', moves: ['Earthquake', 'High Horsepower', 'Iron Head', 'Protect'], nature: 'Jolly', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Tyranitar', item: 'Assault Vest', ability: 'Sand Stream', moves: ['Rock Slide', 'Knock Off', 'Brick Break', 'Snarl'], nature: 'Adamant', evs: sp(32, 32, 0, 0, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Rotom', item: 'Sitrus Berry', ability: 'Levitate', moves: ['Hydro Pump', 'Thunderbolt', 'Will-O-Wisp', 'Thunder Wave'], nature: 'Modest', evs: sp(32, 0, 11, 11, 12, 0), ivs: ivs31, level: 50 },
      { species: 'Volcarona', item: 'Life Orb', ability: 'Flame Body', moves: ['Overheat', 'Bug Buzz', 'Tailwind', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  // ── Matt Bruno & Noah Gardner ────────────────────────────
  {
    id: 'community-mattbruno-absol-tr',
    name: 'Mega Absol Trick Room',
    description: 'Mega Absol Justified + Sucker Punch. Farigiraf TR setter. Sneasler Fake Out + CC. Dragonite priority. Whimsicott Tailwind backup mode.',
    archetype: 'Trick Room + Mega',
    tags: ['trick-room', 'mega-focused', 'semi-trick-room'],
    format: 'season-m1',
    author: 'Matt Bruno & Noah Gardner',
    source: 'https://youtu.be/ZV0G_ltASns',
    pokemon: [
      { species: 'Absol', item: 'Absolite Z', ability: 'Justified', moves: ['Sucker Punch', 'Double-Edge', 'Close Combat', 'Protect'], nature: 'Jolly', evs: sp(1, 32, 0, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Farigiraf', item: 'Sitrus Berry', ability: 'Armor Tail', moves: ['Hyper Voice', 'Psychic', 'Helping Hand', 'Trick Room'], nature: 'Modest', evs: sp(32, 0, 13, 8, 13, 0), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'White Herb', ability: 'Unburden', moves: ['Dire Claw', 'Close Combat', 'Fake Out', 'Protect'], nature: 'Adamant', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Dragonite', item: 'Loaded Dice', ability: 'Inner Focus', moves: ['Scale Shot', 'Iron Head', 'Haze', 'Protect'], nature: 'Adamant', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Covert Cloak', ability: 'Prankster', moves: ['Moonblast', 'Tickle', 'Tailwind', 'Encore'], nature: 'Calm', evs: sp(32, 0, 10, 1, 9, 14), ivs: ivs31, level: 50 },
      { species: 'Typhlosion-Hisui', item: 'Choice Specs', ability: 'Blaze', moves: ['Eruption', 'Heat Wave', 'Overheat', 'Shadow Ball'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  // ── Matt Bruno & Ryan Loseto ─────────────────────────────
  {
    id: 'community-mattbruno-starmie',
    name: 'Mega Starmie Physical',
    description: 'Mega Starmie physical attacker with Waterfall + Aqua Jet. Corviknight Tailwind + Bulk Up. Tyranitar sand support. Volcarona Rage Powder redirect.',
    archetype: 'Mega-Focused + Tailwind',
    tags: ['mega-focused', 'tailwind', 'balanced'],
    format: 'season-m1',
    author: 'Matt Bruno & Ryan Loseto',
    source: 'https://youtu.be/ONzl36H4JEw',
    pokemon: [
      { species: 'Starmie', item: 'Starminite', ability: 'Natural Cure', moves: ['Waterfall', 'Zen Headbutt', 'Aqua Jet', 'Protect'], nature: 'Adamant', evs: sp(0, 32, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Meowscarada', item: 'Focus Sash', ability: 'Overgrow', moves: ['Flower Trick', 'Knock Off', 'Triple Axel', 'Protect'], nature: 'Adamant', evs: sp(0, 32, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Volcarona', item: 'Leftovers', ability: 'Flame Body', moves: ['Fiery Dance', 'Struggle Bug', 'Rage Powder', 'Protect'], nature: 'Bold', evs: sp(32, 0, 26, 1, 6, 1), ivs: ivs31, level: 50 },
      { species: 'Corviknight', item: 'Sitrus Berry', ability: 'Mirror Armor', moves: ['Brave Bird', 'Bulk Up', 'Tailwind', 'Roost'], nature: 'Impish', evs: sp(29, 5, 20, 0, 1, 11), ivs: ivs31, level: 50 },
      { species: 'Tyranitar', item: 'Assault Vest', ability: 'Sand Stream', moves: ['Rock Slide', 'Knock Off', 'Low Kick', 'Dragon Tail'], nature: 'Adamant', evs: sp(28, 32, 0, 0, 1, 5), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Clear Amulet', ability: 'Sand Veil', moves: ['Stomping Tantrum', 'Dragon Claw', 'Earthquake', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 1, 0, 1, 32), ivs: ivs31, level: 50 },
    ],
  },
  // ── Raghav Malaviya & Collin Heier ───────────────────────
  {
    id: 'community-raghav-froslass-veil',
    name: 'Froslass Veil + Conkeldurr',
    description: 'Mega Froslass Aurora Veil in Snow. Milotic Competitive pivot. Conkeldurr Guts Flame Orb TR sweeper. Glimmora Meteor Beam power.',
    archetype: 'Weather (Snow) + Mega',
    tags: ['weather-snow', 'mega-focused', 'trick-room'],
    format: 'season-m1',
    author: 'Raghav Malaviya & Collin Heier',
    source: 'https://youtu.be/Ex3-HuaOPAw',
    pokemon: [
      { species: 'Froslass', item: 'Froslassite', ability: 'Cursed Body', moves: ['Blizzard', 'Aurora Veil', 'Shadow Ball', 'Protect'], nature: 'Modest', evs: sp(32, 0, 4, 1, 1, 28), ivs: ivs31, level: 50 },
      { species: 'Milotic', item: 'Leftovers', ability: 'Competitive', moves: ['Muddy Water', 'Coil', 'Hypnosis', 'Icy Wind'], nature: 'Calm', evs: sp(30, 0, 22, 1, 10, 3), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Trick Room', 'Rage Powder', 'Life Dew'], nature: 'Bold', evs: sp(32, 0, 10, 1, 23, 0), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Assault Vest', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'U-turn', 'Throat Chop'], nature: 'Impish', evs: sp(32, 1, 20, 0, 8, 5), ivs: ivs31, level: 50 },
      { species: 'Glimmora', item: 'Power Herb', ability: 'Toxic Debris', moves: ['Sludge Bomb', 'Meteor Beam', 'Earth Power', 'Spiky Shield'], nature: 'Modest', evs: sp(24, 0, 1, 21, 1, 19), ivs: ivs31, level: 50 },
      { species: 'Conkeldurr', item: 'Flame Orb', ability: 'Guts', moves: ['Drain Punch', 'Mach Punch', 'Rock Slide', 'Protect'], nature: 'Brave', evs: sp(32, 30, 1, 0, 3, 0), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-raghav-dragonite-rain',
    name: 'Mega Dragonite Rain',
    description: 'Mega Dragonite Dragon Pulse + Hurricane + Thunder in rain. Pelipper Drizzle + Tailwind. Archaludon Electro Shot. Sinistcha Trick Room backup.',
    archetype: 'Weather (Rain) + Mega',
    tags: ['weather-rain', 'mega-focused', 'semi-trick-room'],
    format: 'season-m1',
    author: 'Raghav Malaviya & Collin Heier',
    source: 'https://youtu.be/LigpncX1F2Q',
    pokemon: [
      { species: 'Dragonite', item: 'Dragoninite', ability: 'Multiscale', moves: ['Dragon Pulse', 'Hurricane', 'Thunder', 'Protect'], nature: 'Modest', evs: sp(32, 0, 1, 19, 1, 13), ivs: ivs31, level: 50 },
      { species: 'Pelipper', item: 'Focus Sash', ability: 'Drizzle', moves: ['Muddy Water', 'Hurricane', 'Tailwind', 'Protect'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Archaludon', item: 'Assault Vest', ability: 'Stamina', moves: ['Electro Shot', 'Flash Cannon', 'Body Press', 'Snarl'], nature: 'Modest', evs: sp(32, 0, 2, 6, 21, 5), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Trick Room', 'Rage Powder', 'Life Dew'], nature: 'Bold', evs: sp(32, 0, 11, 0, 23, 0), ivs: ivs31, level: 50 },
      { species: 'Ursaluna', item: 'Flame Orb', ability: 'Guts', moves: ['Facade', 'Headlong Rush', 'Earthquake', 'Protect'], nature: 'Adamant', evs: sp(18, 32, 1, 0, 1, 14), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Safety Goggles', ability: 'Intimidate', moves: ['Fake Out', 'Parting Shot', 'Flare Blitz', 'Will-O-Wisp'], nature: 'Careful', evs: sp(32, 0, 13, 0, 13, 8), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-raghav-delphox-sand',
    name: 'Mega Delphox Sand',
    description: 'Mega Delphox Levitate special attacker. Tyranitar sand + Excadrill Sand Rush. Gyarados Intimidate + Thunder Wave. Conkeldurr Guts TR sweeper.',
    archetype: 'Weather (Sand) + Mega',
    tags: ['weather-sand', 'mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Raghav Malaviya & Collin Heier',
    source: 'https://youtu.be/DvnxO5cn498',
    pokemon: [
      { species: 'Delphox', item: 'Delphoxite', ability: 'Levitate', moves: ['Heat Wave', 'Psychic', 'Substitute', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Tyranitar', item: 'Assault Vest', ability: 'Sand Stream', moves: ['Rock Slide', 'Knock Off', 'Low Kick', 'Ice Punch'], nature: 'Adamant', evs: sp(32, 7, 0, 0, 20, 7), ivs: ivs31, level: 50 },
      { species: 'Excadrill', item: 'Clear Amulet', ability: 'Sand Rush', moves: ['Earthquake', 'Iron Head', 'High Horsepower', 'Protect'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Gyarados', item: 'Leftovers', ability: 'Intimidate', moves: ['Waterfall', 'Thunder Wave', 'Taunt', 'Protect'], nature: 'Adamant', evs: sp(32, 5, 13, 0, 11, 5), ivs: ivs31, level: 50 },
      { species: 'Conkeldurr', item: 'Flame Orb', ability: 'Guts', moves: ['Drain Punch', 'Mach Punch', 'Ice Punch', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Trick Room', 'Rage Powder', 'Strength Sap'], nature: 'Bold', evs: sp(32, 0, 11, 0, 23, 0), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-raghav-excadrill-mega',
    name: 'Mega Excadrill Swords Dance',
    description: 'Mega Excadrill Sand Rush + Swords Dance sweeper. Orthworm Earth Eater immunity + Shed Tail. Dragonite Multiscale. Sinistcha Hospitality calm mind.',
    archetype: 'Mega-Focused + Setup',
    tags: ['mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Raghav Malaviya & Collin Heier',
    source: 'https://www.youtube.com/watch?v=LZTFFUA4TQM',
    pokemon: [
      { species: 'Excadrill', item: 'Excadrite', ability: 'Sand Rush', moves: ['Iron Head', 'Earthquake', 'Swords Dance', 'Protect'], nature: 'Jolly', evs: sp(1, 32, 0, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Orthworm', item: 'Sitrus Berry', ability: 'Earth Eater', moves: ['Body Press', 'Shed Tail', 'Iron Defense', 'Protect'], nature: 'Bold', evs: sp(32, 0, 5, 0, 24, 5), ivs: ivs31, level: 50 },
      { species: 'Dragonite', item: 'Loaded Dice', ability: 'Multiscale', moves: ['Scale Shot', 'Extreme Speed', 'Earthquake', 'Protect'], nature: 'Adamant', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Assault Vest', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Darkest Lariat', 'U-turn'], nature: 'Adamant', evs: sp(32, 5, 8, 0, 10, 11), ivs: ivs31, level: 50 },
      { species: 'Rotom', item: 'Leftovers', ability: 'Levitate', moves: ['Hydro Pump', 'Nasty Plot', 'Thunderbolt', 'Protect'], nature: 'Modest', evs: sp(32, 0, 1, 15, 0, 18), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Iapapa Berry', ability: 'Heatproof', moves: ['Matcha Gotcha', 'Calm Mind', 'Shadow Ball', 'Protect'], nature: 'Modest', evs: sp(32, 0, 6, 10, 16, 2), ivs: ivs31, level: 50 },
    ],
  },
  // ── Alex Soto ─────────────────────────────────────────────
  {
    id: 'community-alex-salamence',
    name: 'Salamence-M Tailwind + TR',
    description: 'Mega Salamence Aerilate Tailwind setter + Dragon/Normal sweeper. Farigiraf TR backup. Ursaluna Guts. Sinistcha Hospitality + Rage Powder.',
    archetype: 'Semi-Trick Room + Tailwind',
    tags: ['mega-focused', 'semi-trick-room', 'tailwind'],
    format: 'season-m1',
    author: 'Alex Soto',
    source: 'https://x.com/lenvgc/status/2039727064173924759',
    pokemon: [
      { species: 'Salamence', item: 'Salamencite', ability: 'Aerilate', moves: ['Draco Meteor', 'Hyper Voice', 'Tailwind', 'Protect'], nature: 'Modest', evs: sp(6, 0, 1, 20, 7, 32), ivs: ivs31, level: 50 },
      { species: 'Rotom', item: 'Aguav Berry', ability: 'Levitate', moves: ['Hydro Pump', 'Thunderbolt', 'Will-O-Wisp', 'Protect'], nature: 'Bold', evs: sp(32, 0, 13, 6, 10, 5), ivs: ivs31, level: 50 },
      { species: 'Farigiraf', item: 'Throat Spray', ability: 'Armor Tail', moves: ['Hyper Voice', 'Psychic', 'Trick Room', 'Protect'], nature: 'Modest', evs: sp(29, 0, 11, 10, 11, 5), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Assault Vest', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Throat Chop', 'U-turn'], nature: 'Adamant', evs: sp(32, 5, 2, 0, 10, 17), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Life Dew', 'Rage Powder', 'Trick Room'], nature: 'Calm', evs: sp(32, 0, 11, 1, 20, 2), ivs: ivs31, level: 50 },
      { species: 'Ursaluna', item: 'Flame Orb', ability: 'Guts', moves: ['Facade', 'Headlong Rush', 'Earthquake', 'Protect'], nature: 'Adamant', evs: sp(18, 32, 1, 0, 8, 7), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-alex-gardevoir-tr',
    name: 'Gardevoir-M TR Balance',
    description: 'Mega Gardevoir Trick Room setter + Hyper Voice spread. Corviknight Tailwind alternative. Sinistcha Hospitality. Garchomp Choice Scarf check.',
    archetype: 'Semi-Trick Room + Mega',
    tags: ['mega-focused', 'semi-trick-room', 'tailwind'],
    format: 'season-m1',
    author: 'Alex Soto',
    source: 'https://x.com/LenVGC/status/2040770004753256949',
    pokemon: [
      { species: 'Gardevoir', item: 'Gardevoirite', ability: 'Telepathy', moves: ['Hyper Voice', 'Psyshock', 'Trick Room', 'Protect'], nature: 'Modest', evs: sp(32, 0, 14, 15, 1, 4), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Assault Vest', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Throat Chop', 'U-turn'], nature: 'Adamant', evs: sp(32, 5, 1, 0, 11, 17), ivs: ivs31, level: 50 },
      { species: 'Rotom', item: 'Covert Cloak', ability: 'Levitate', moves: ['Hydro Pump', 'Thunderbolt', 'Will-O-Wisp', 'Eerie Impulse'], nature: 'Calm', evs: sp(32, 0, 1, 1, 13, 19), ivs: ivs31, level: 50 },
      { species: 'Corviknight', item: 'Leftovers', ability: 'Mirror Armor', moves: ['Brave Bird', 'Bulk Up', 'Roost', 'Tailwind'], nature: 'Careful', evs: sp(32, 3, 1, 0, 15, 15), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Choice Scarf', ability: 'Rough Skin', moves: ['Earthquake', 'Dragon Claw', 'Stomping Tantrum', 'Rock Slide'], nature: 'Adamant', evs: sp(8, 32, 1, 0, 11, 14), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Life Dew', 'Rage Powder', 'Trick Room'], nature: 'Bold', evs: sp(32, 0, 24, 1, 8, 1), ivs: ivs31, level: 50 },
    ],
  },
  // ── Scooteezy ─────────────────────────────────────────────
  {
    id: 'community-scooteezy-lucario',
    name: 'Mega Lucario Special',
    description: 'Mega Lucario-Z special attacker with Aura Sphere + Flash Cannon. Whimsicott Fake Tears. Volcarona Rage Powder. Basculegion Choice Scarf Adaptability.',
    archetype: 'Mega-Focused + Tailwind',
    tags: ['mega-focused', 'tailwind', 'hyper-offense'],
    format: 'season-m1',
    author: 'Scooteezy',
    source: 'https://youtu.be/DJNIlEq8igo',
    pokemon: [
      { species: 'Lucario', item: 'Lucarionite Z', ability: 'Inner Focus', moves: ['Aura Sphere', 'Flash Cannon', 'Dark Pulse', 'Protect'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Moonblast', 'Tailwind', 'Fake Tears', 'Encore'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Basculegion', item: 'Choice Scarf', ability: 'Adaptability', moves: ['Wave Crash', 'Flip Turn', 'Last Respects', 'Phantom Force'], nature: 'Adamant', evs: sp(0, 32, 0, 0, 2, 32), ivs: ivs31, level: 50 },
      { species: 'Arcanine-Hisui', item: 'Life Orb', ability: 'Intimidate', moves: ['Rock Slide', 'Flare Blitz', 'Extreme Speed', 'Protect'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Volcarona', item: 'Covert Cloak', ability: 'Flame Body', moves: ['Rage Powder', 'Heat Wave', 'Bug Buzz', 'Protect'], nature: 'Modest', evs: sp(27, 0, 1, 5, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Ursaluna', item: 'Flame Orb', ability: 'Guts', moves: ['Earthquake', 'Headlong Rush', 'Facade', 'Protect'], nature: 'Jolly', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-scooteezy-feraligatr',
    name: 'Feraligatr-M Rain Rush',
    description: 'Mega Feraligatr Dragonize + Liquidation in rain. Pelipper Drizzle + Tailwind. Archaludon Electro Shot. Sinistcha Trick Room. Ursaluna Guts.',
    archetype: 'Weather (Rain) + Mega',
    tags: ['weather-rain', 'mega-focused', 'semi-trick-room'],
    format: 'season-m1',
    author: 'Scooteezy',
    source: 'https://www.youtube.com/watch?v=lao5GVI5byc',
    pokemon: [
      { species: 'Feraligatr', item: 'Feraligite', ability: 'Dragonize', moves: ['Double-Edge', 'Liquidation', 'Aqua Jet', 'Protect'], nature: 'Adamant', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Pelipper', item: 'Damp Rock', ability: 'Drizzle', moves: ['Weather Ball', 'Hurricane', 'Tailwind', 'Wide Guard'], nature: 'Modest', evs: sp(32, 0, 2, 5, 26, 1), ivs: ivs31, level: 50 },
      { species: 'Archaludon', item: 'Assault Vest', ability: 'Stamina', moves: ['Electro Shot', 'Body Press', 'Draco Meteor', 'Flash Cannon'], nature: 'Modest', evs: sp(32, 0, 2, 6, 19, 7), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Sitrus Berry', ability: 'Intimidate', moves: ['Fake Out', 'Parting Shot', 'Helping Hand', 'Darkest Lariat'], nature: 'Careful', evs: sp(32, 1, 12, 0, 20, 1), ivs: ivs31, level: 50 },
      { species: 'Ursaluna', item: 'Flame Orb', ability: 'Guts', moves: ['Earthquake', 'Facade', 'Headlong Rush', 'Protect'], nature: 'Adamant', evs: sp(1, 32, 0, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Mental Herb', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Strength Sap', 'Trick Room', 'Rage Powder'], nature: 'Sassy', evs: sp(32, 0, 13, 1, 20, 0), ivs: ivs31, level: 50 },
    ],
  },
  // ── Jon-Luke ──────────────────────────────────────────────
  {
    id: 'community-jonluke-farigiraf-tr',
    name: 'Froslass + Farigiraf TR',
    description: 'Mega Froslass Aurora Veil. Farigiraf Armor Tail TR setter. Sneasler Fake Out. Ursaluna Guts Flame Orb TR sweeper. Sinistcha Hospitality.',
    archetype: 'Semi-Trick Room + Snow',
    tags: ['weather-snow', 'mega-focused', 'semi-trick-room'],
    format: 'season-m1',
    author: 'Jon-Luke',
    source: 'https://www.youtube.com/watch?v=m19FWkOU48M',
    pokemon: [
      { species: 'Farigiraf', item: 'Throat Spray', ability: 'Armor Tail', moves: ['Hyper Voice', 'Psychic', 'Trick Room', 'Protect'], nature: 'Modest', evs: sp(26, 0, 12, 20, 6, 2), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'White Herb', ability: 'Unburden', moves: ['Fake Out', 'Dire Claw', 'Close Combat', 'Protect'], nature: 'Adamant', evs: sp(12, 20, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Assault Vest', ability: 'Intimidate', moves: ['Fake Out', 'Darkest Lariat', 'Flare Blitz', 'U-turn'], nature: 'Adamant', evs: sp(31, 5, 21, 0, 8, 1), ivs: ivs31, level: 50 },
      { species: 'Ursaluna', item: 'Flame Orb', ability: 'Guts', moves: ['Facade', 'Headlong Rush', 'Earthquake', 'Protect'], nature: 'Adamant', evs: sp(18, 20, 1, 0, 12, 15), ivs: ivs31, level: 50 },
      { species: 'Froslass', item: 'Froslassite', ability: 'Snow Cloak', moves: ['Blizzard', 'Shadow Ball', 'Aurora Veil', 'Protect'], nature: 'Timid', evs: sp(0, 0, 2, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Rage Powder', 'Strength Sap', 'Curse'], nature: 'Bold', evs: sp(32, 0, 4, 1, 28, 1), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-jonluke-delphox',
    name: 'Mega Delphox Tailwind',
    description: 'Mega Delphox Levitate + Heat Wave + Psychic. Talonflame Gale Wings Tailwind. Farigiraf Armor Tail + TR backup. Sneasler Fake Out + CC.',
    archetype: 'Mega-Focused + Tailwind',
    tags: ['mega-focused', 'tailwind', 'semi-trick-room'],
    format: 'season-m1',
    author: 'Jon-Luke',
    source: 'https://www.youtube.com/watch?v=BLE48QbyEww',
    pokemon: [
      { species: 'Delphox', item: 'Delphoxite', ability: 'Blaze', moves: ['Psychic', 'Heat Wave', 'Encore', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Clear Amulet', ability: 'Rough Skin', moves: ['Stomping Tantrum', 'Dragon Claw', 'Earthquake', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 0, 0, 2, 32), ivs: ivs31, level: 50 },
      { species: 'Rotom', item: 'Choice Scarf', ability: 'Levitate', moves: ['Hydro Pump', 'Volt Switch', 'Discharge', 'Trick'], nature: 'Modest', evs: sp(0, 0, 2, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Talonflame', item: 'Covert Cloak', ability: 'Gale Wings', moves: ['Brave Bird', 'Sunny Day', 'Taunt', 'Tailwind'], nature: 'Adamant', evs: sp(0, 32, 0, 0, 2, 32), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'White Herb', ability: 'Unburden', moves: ['Fake Out', 'Dire Claw', 'Close Combat', 'Protect'], nature: 'Adamant', evs: sp(2, 30, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Farigiraf', item: 'Throat Spray', ability: 'Armor Tail', moves: ['Hyper Voice', 'Psychic', 'Trick Room', 'Protect'], nature: 'Modest', evs: sp(26, 0, 6, 20, 12, 2), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-jonluke-feraligatr-rain',
    name: 'Feraligatr-M Rain (Jon-Luke)',
    description: 'Mega Feraligatr Dragonize + Swords Dance. Archaludon Electro Shot. Pelipper Drizzle + Tailwind. Sinistcha TR backup. Greninja Water Shuriken.',
    archetype: 'Weather (Rain) + Mega',
    tags: ['weather-rain', 'mega-focused', 'tailwind'],
    format: 'season-m1',
    author: 'Jon-Luke & GeordiVGC',
    source: 'https://www.youtube.com/watch?v=xhbHm-CnfGA',
    pokemon: [
      { species: 'Feraligatr', item: 'Feraligite', ability: 'Dragonize', moves: ['Double-Edge', 'Liquidation', 'Swords Dance', 'Protect'], nature: 'Adamant', evs: sp(29, 20, 1, 0, 1, 15), ivs: ivs31, level: 50 },
      { species: 'Archaludon', item: 'Assault Vest', ability: 'Stamina', moves: ['Electro Shot', 'Draco Meteor', 'Flash Cannon', 'Body Press'], nature: 'Modest', evs: sp(32, 0, 2, 5, 17, 10), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Sitrus Berry', ability: 'Intimidate', moves: ['Fake Out', 'Darkest Lariat', 'Will-O-Wisp', 'Parting Shot'], nature: 'Careful', evs: sp(32, 1, 6, 0, 20, 7), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Rocky Helmet', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Rage Powder', 'Strength Sap', 'Trick Room'], nature: 'Bold', evs: sp(31, 0, 5, 0, 30, 0), ivs: ivs31, level: 50 },
      { species: 'Pelipper', item: 'Focus Sash', ability: 'Drizzle', moves: ['Weather Ball', 'Hurricane', 'Tailwind', 'Protect'], nature: 'Modest', evs: sp(0, 0, 0, 32, 2, 32), ivs: ivs31, level: 50 },
      { species: 'Greninja', item: 'Loaded Dice', ability: 'Torrent', moves: ['Water Shuriken', 'Dark Pulse', 'Ice Beam', 'Protect'], nature: 'Timid', evs: sp(0, 0, 2, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  // ── Maddy (via Pokeaim) ───────────────────────────────────
  {
    id: 'community-maddy-gengar',
    name: 'Mega Gengar Shadow Tag',
    description: 'Mega Gengar Shadow Tag trapper + Disable. Whimsicott Tailwind + Fake Tears. Sneasler Fake Out. Kingambit Defiant + Swords Dance. Primarina Perish Song.',
    archetype: 'Mega-Focused + Tailwind',
    tags: ['mega-focused', 'tailwind', 'balanced'],
    format: 'season-m1',
    author: 'Maddy (via Pokeaim)',
    source: 'https://www.youtube.com/watch?v=M_7lwfEQtpg',
    pokemon: [
      { species: 'Gengar', item: 'Gengarite', ability: 'Shadow Tag', moves: ['Shadow Ball', 'Sludge Bomb', 'Disable', 'Protect'], nature: 'Timid', evs: sp(0, 0, 1, 32, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Covert Cloak', ability: 'Prankster', moves: ['Moonblast', 'Fake Tears', 'Tailwind', 'Encore'], nature: 'Calm', evs: sp(32, 0, 2, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Sitrus Berry', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Darkest Lariat', 'Parting Shot'], nature: 'Careful', evs: sp(32, 0, 5, 0, 25, 4), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Black Glasses', ability: 'Defiant', moves: ['Swords Dance', 'Kowtow Cleave', 'Sucker Punch', 'Protect'], nature: 'Adamant', evs: sp(30, 32, 1, 0, 1, 2), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'Focus Sash', ability: 'Unburden', moves: ['Close Combat', 'Fake Out', 'Protect', 'Dire Claw'], nature: 'Jolly', evs: sp(0, 32, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Primarina', item: 'Rocky Helmet', ability: 'Liquid Voice', moves: ['Hyper Voice', 'Perish Song', 'Moonblast', 'Protect'], nature: 'Calm', evs: sp(32, 0, 13, 2, 19, 0), ivs: ivs31, level: 50 },
    ],
  },
  // ── Oliver Gausden ────────────────────────────────────────
  {
    id: 'community-oliver-delphox',
    name: 'Mega Delphox Offense',
    description: 'Mega Delphox Nasty Plot + Levitate. Garchomp Stomping Tantrum + Earthquake. Sneasler White Herb CC. Aegislash Wide Guard + Shadow Ball. Meowscarada Flower Trick.',
    archetype: 'Mega-Focused + Hyper Offense',
    tags: ['mega-focused', 'hyper-offense'],
    format: 'season-m1',
    author: 'Oliver Gausden',
    source: 'https://x.com/dinomitevgc/status/2040359598465441879',
    pokemon: [
      { species: 'Delphox', item: 'Delphoxite', ability: 'Levitate', moves: ['Heat Wave', 'Psychic', 'Nasty Plot', 'Protect'], nature: 'Timid', evs: sp(1, 0, 1, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Clear Amulet', ability: 'Rough Skin', moves: ['Stomping Tantrum', 'Dragon Claw', 'Earthquake', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'White Herb', ability: 'Unburden', moves: ['Close Combat', 'Dire Claw', 'Fake Out', 'Protect'], nature: 'Jolly', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Clefable', item: 'Sitrus Berry', ability: 'Unaware', moves: ['Moonblast', 'Follow Me', 'Life Dew', 'Protect'], nature: 'Calm', evs: sp(32, 0, 23, 1, 10, 0), ivs: ivs31, level: 50 },
      { species: 'Aegislash', item: 'Weakness Policy', ability: 'Stance Change', moves: ['Shadow Ball', 'Shadow Sneak', 'Wide Guard', "King's Shield"], nature: 'Quiet', evs: sp(32, 1, 0, 32, 1, 0), ivs: ivs31, level: 50 },
      { species: 'Meowscarada', item: 'Focus Sash', ability: 'Overgrow', moves: ['Flower Trick', 'Knock Off', 'Sucker Punch', 'Protect'], nature: 'Adamant', evs: sp(1, 32, 0, 0, 1, 32), ivs: ivs31, level: 50 },
    ],
  },
  // ── Iker Rodrigo & SergioramVGC ───────────────────────────
  {
    id: 'community-iker-sergio-garchomp-tr',
    name: 'Garchomp-M Trick Room Balance',
    description: 'Mega Garchomp bulky TR sweeper. Sinistcha Trick Room setter. Corviknight Bulk Up. Gyarados Intimidate + Thunder Wave. Kingambit Brave Defiant.',
    archetype: 'Trick Room + Mega',
    tags: ['trick-room', 'mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Iker Rodrigo & SergioramVGC',
    source: 'https://www.youtube.com/watch?v=2t4XLrj5ulQ',
    pokemon: [
      { species: 'Garchomp', item: 'Garchompite', ability: 'Rough Skin', moves: ['Protect', 'Rock Slide', 'Dragon Claw', 'Earthquake'], nature: 'Adamant', evs: sp(32, 10, 1, 0, 13, 10), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Protect', 'Matcha Gotcha', 'Rage Powder', 'Trick Room'], nature: 'Calm', evs: sp(30, 0, 10, 1, 25, 0), ivs: ivs31, level: 50 },
      { species: 'Corviknight', item: 'Covert Cloak', ability: 'Mirror Armor', moves: ['Brave Bird', 'Roost', 'Body Press', 'Bulk Up'], nature: 'Careful', evs: sp(31, 1, 9, 0, 25, 0), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'Focus Sash', ability: 'Unburden', moves: ['Protect', 'Fake Out', 'Close Combat', 'Dire Claw'], nature: 'Jolly', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Gyarados', item: 'Safety Goggles', ability: 'Intimidate', moves: ['Protect', 'Waterfall', 'Thunder Wave', 'Taunt'], nature: 'Careful', evs: sp(32, 1, 23, 0, 10, 0), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Black Glasses', ability: 'Defiant', moves: ['Protect', 'Swords Dance', 'Kowtow Cleave', 'Sucker Punch'], nature: 'Brave', evs: sp(32, 32, 1, 0, 1, 0), ivs: ivs31, level: 50 },
    ],
  },
  // ── Iker Rodrigo ──────────────────────────────────────────
  {
    id: 'community-iker-gengar-perish',
    name: 'Mega Gengar Perish Trap',
    description: 'Mega Gengar Shadow Tag Perish Song trap. Incineroar U-turn pivot. Rotom Wash Will-O-Wisp. Maushold Friend Guard. Corviknight Tailwind + Bulk Up.',
    archetype: 'Mega-Focused + Perish Trap',
    tags: ['mega-focused', 'balanced', 'tailwind'],
    format: 'season-m1',
    author: 'Iker Rodrigo',
    source: 'https://x.com/RekiVGC/status/2040821777581142073',
    pokemon: [
      { species: 'Gengar', item: 'Gengarite', ability: 'Shadow Tag', moves: ['Shadow Ball', 'Disable', 'Perish Song', 'Protect'], nature: 'Timid', evs: sp(32, 0, 1, 1, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Covert Cloak', ability: 'Intimidate', moves: ['Fake Out', 'U-turn', 'Flare Blitz', 'Protect'], nature: 'Careful', evs: sp(32, 1, 13, 0, 20, 0), ivs: ivs31, level: 50 },
      { species: 'Rotom', item: 'Sitrus Berry', ability: 'Levitate', moves: ['Volt Switch', 'Hydro Pump', 'Will-O-Wisp', 'Protect'], nature: 'Modest', evs: sp(32, 0, 22, 10, 0, 2), ivs: ivs31, level: 50 },
      { species: 'Maushold', item: 'Safety Goggles', ability: 'Friend Guard', moves: ['Encore', 'Super Fang', 'Taunt', 'Protect'], nature: 'Timid', evs: sp(32, 0, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', moves: ['Earthquake', 'Rock Slide', 'Dragon Claw', 'Protect'], nature: 'Jolly', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Corviknight', item: 'Leftovers', ability: 'Mirror Armor', moves: ['Brave Bird', 'Tailwind', 'Bulk Up', 'Roost'], nature: 'Careful', evs: sp(31, 1, 9, 0, 25, 0), ivs: ivs31, level: 50 },
    ],
  },
  // ── Marcos Perez ──────────────────────────────────────────
  {
    id: 'community-marcos-dual-mega',
    name: 'Dual Mega: Gyarados + Delphox',
    description: 'Mega Delphox Calm Mind + Mega Gyarados Dragon Dance — two mega options. Sneasler Fake Out + Coaching. Ninetales-A Aurora Veil. Orthworm Shed Tail.',
    archetype: 'Dual Mega',
    tags: ['mega-focused', 'hyper-offense'],
    format: 'season-m1',
    author: 'Marcos Perez',
    source: 'https://www.youtube.com/watch?v=TB1-kdFaBuY',
    pokemon: [
      { species: 'Delphox', item: 'Delphoxite', ability: 'Levitate', moves: ['Protect', 'Calm Mind', 'Heat Wave', 'Psychic'], nature: 'Timid', evs: sp(32, 0, 1, 13, 1, 19), ivs: ivs31, level: 50 },
      { species: 'Gyarados', item: 'Gyaradosite', ability: 'Mold Breaker', moves: ['Protect', 'Waterfall', 'Dragon Dance', 'Crunch'], nature: 'Adamant', evs: sp(32, 5, 1, 0, 3, 25), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'Focus Sash', ability: 'Unburden', moves: ['Fake Out', 'Coaching', 'Close Combat', 'Dire Claw'], nature: 'Jolly', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Choice Scarf', ability: 'Rough Skin', moves: ['Earthquake', 'Rock Slide', 'Dragon Claw', 'Poison Jab'], nature: 'Adamant', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Orthworm', item: 'Sitrus Berry', ability: 'Earth Eater', moves: ['Heavy Slam', 'Shed Tail', 'Protect', 'Body Press'], nature: 'Impish', evs: sp(31, 0, 25, 0, 7, 3), ivs: ivs31, level: 50 },
      { species: 'Ninetales-Alola', item: 'Light Clay', ability: 'Snow Warning', moves: ['Icy Wind', 'Aurora Veil', 'Protect', 'Encore'], nature: 'Timid', evs: sp(32, 0, 1, 0, 1, 32), ivs: ivs31, level: 50 },
    ],
  },
  // ── Abdullah Mohayyuddin & Thaison Hughes ─────────────────
  {
    id: 'community-abdullah-gardevoir-tr',
    name: 'Gardevoir-M TR / Sun',
    description: 'Mega Gardevoir Trick Room + Hyper Voice. Charizard-Y Drought. Venusaur Chlorophyll Chlorophyll sweeper. Ursaluna Guts TR sweeper. Dragonite Haze + Tailwind.',
    archetype: 'Semi-Trick Room + Sun',
    tags: ['mega-focused', 'weather-sun', 'semi-trick-room'],
    format: 'season-m1',
    author: 'Abdullah Mohayyuddin & Thaison Hughes',
    source: 'https://www.youtube.com/watch?v=AqeGkBbxnEI',
    pokemon: [
      { species: 'Gardevoir', item: 'Gardevoirite', ability: 'Telepathy', moves: ['Psychic', 'Hyper Voice', 'Trick Room', 'Protect'], nature: 'Modest', evs: sp(32, 0, 7, 25, 1, 1), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Assault Vest', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Darkest Lariat', 'U-turn'], nature: 'Adamant', evs: sp(32, 25, 1, 0, 7, 1), ivs: ivs31, level: 50 },
      { species: 'Ursaluna', item: 'Flame Orb', ability: 'Guts', moves: ['Facade', 'Headlong Rush', 'Earthquake', 'Protect'], nature: 'Adamant', evs: sp(26, 30, 1, 0, 1, 8), ivs: ivs31, level: 50 },
      { species: 'Charizard', item: 'Charizardite Y', ability: 'Blaze', moves: ['Weather Ball', 'Heat Wave', 'Air Slash', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Venusaur', item: 'Focus Sash', ability: 'Chlorophyll', moves: ['Leaf Storm', 'Sludge Bomb', 'Sleep Powder', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Dragonite', item: 'Loaded Dice', ability: 'Multiscale', moves: ['Scale Shot', 'Haze', 'Tailwind', 'Protect'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  // ── LakeTwo ───────────────────────────────────────────────
  {
    id: 'community-laketwo-perish-trap',
    name: 'Mega Gengar Perish Trap',
    description: 'Mega Gengar Shadow Tag traps + Perish Song. Altaria Natural Cure + Perish Song. Incineroar Snarl + Parting Shot. Sinistcha Rage Powder redirect.',
    archetype: 'Perish Trap + Mega',
    tags: ['mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'LakeTwo',
    source: 'https://www.youtube.com/watch?v=kQ62jwx9kTI',
    pokemon: [
      { species: 'Gengar', item: 'Gengarite', ability: 'Shadow Tag', moves: ['Shadow Ball', 'Disable', 'Perish Song', 'Protect'], nature: 'Timid', evs: sp(32, 0, 2, 2, 30, 0), ivs: ivs31, level: 50 },
      { species: 'Altaria', item: 'Mental Herb', ability: 'Natural Cure', moves: ['Breaking Swipe', 'Roost', 'Perish Song', 'Protect'], nature: 'Careful', evs: sp(32, 0, 1, 0, 32, 1), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Safety Goggles', ability: 'Intimidate', moves: ['Snarl', 'Parting Shot', 'Fake Out', 'Protect'], nature: 'Careful', evs: sp(32, 1, 1, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Eject Button', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Strength Sap', 'Rage Powder', 'Protect'], nature: 'Bold', evs: sp(32, 0, 1, 1, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Maushold', item: "King's Rock", ability: 'Friend Guard', moves: ['Population Bomb', 'Encore', 'Follow Me', 'Protect'], nature: 'Jolly', evs: sp(32, 0, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Grimmsnarl', item: 'Covert Cloak', ability: 'Prankster', moves: ['Fake Out', 'Parting Shot', 'Taunt', 'Protect'], nature: 'Careful', evs: sp(32, 0, 1, 0, 32, 1), ivs: ivs31, level: 50 },
    ],
  },
  // ── Kurbito ───────────────────────────────────────────────
  {
    id: 'community-kurbito-sun-gengar',
    name: 'Charizard-Y Sun + Mega Gengar',
    description: 'Charizard-Y Drought + Heat Wave spread. Mega Gengar Shadow Tag trapper. Sneasler Fake Out. Maushold Follow Me Friend Guard. Kingambit Swords Dance.',
    archetype: 'Weather (Sun) + Mega',
    tags: ['weather-sun', 'mega-focused', 'hyper-offense'],
    format: 'season-m1',
    author: 'Kurbito',
    source: 'https://x.com/Kurbitoo/status/2040803786596217217',
    pokemon: [
      { species: 'Charizard', item: 'Charizardite Y', ability: 'Drought', moves: ['Protect', 'Heat Wave', 'Solar Beam', 'Weather Ball'], nature: 'Modest', evs: sp(25, 0, 2, 21, 2, 16), ivs: ivs31, level: 50 },
      { species: 'Maushold', item: 'Chople Berry', ability: 'Friend Guard', moves: ['Protect', 'Follow Me', 'Super Fang', 'Taunt'], nature: 'Jolly', evs: sp(32, 0, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Choice Scarf', ability: 'Rough Skin', moves: ['Earthquake', 'Dragon Claw', 'Bulldoze', 'Rock Slide'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Life Orb', ability: 'Defiant', moves: ['Protect', 'Swords Dance', 'Sucker Punch', 'Assurance'], nature: 'Adamant', evs: sp(14, 32, 0, 0, 0, 20), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'Focus Sash', ability: 'Unburden', moves: ['Protect', 'Fake Out', 'Close Combat', 'Dire Claw'], nature: 'Jolly', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Gengar', item: 'Gengarite', ability: 'Shadow Tag', moves: ['Protect', 'Icy Wind', 'Substitute', 'Shadow Ball'], nature: 'Timid', evs: sp(16, 0, 11, 6, 1, 32), ivs: ivs31, level: 50 },
    ],
  },
  // ── Joseph Ugarte ─────────────────────────────────────────
  {
    id: 'community-joseph-tyranitar-sand',
    name: 'Mega Tyranitar Sand (Ugarte)',
    description: 'Mega Tyranitar sand setter + Rock Slide. Excadrill Sand Rush sweeper. Corviknight Tailwind + Bulk Up. Primarina Haze. Sinistcha TR backup.',
    archetype: 'Weather (Sand) + Mega',
    tags: ['weather-sand', 'mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Joseph Ugarte',
    source: 'https://youtu.be/DAwnCskX_uI',
    pokemon: [
      { species: 'Tyranitar', item: 'Tyranitarite', ability: 'Sand Stream', moves: ['Rock Slide', 'Low Kick', 'Crunch', 'Protect'], nature: 'Adamant', evs: sp(31, 16, 1, 0, 1, 17), ivs: ivs31, level: 50 },
      { species: 'Excadrill', item: 'Focus Sash', ability: 'Sand Rush', moves: ['Iron Head', 'High Horsepower', 'Earthquake', 'Protect'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Corviknight', item: 'Leftovers', ability: 'Mirror Armor', moves: ['Brave Bird', 'Bulk Up', 'Roost', 'Tailwind'], nature: 'Adamant', evs: sp(31, 13, 5, 0, 1, 16), ivs: ivs31, level: 50 },
      { species: 'Primarina', item: 'Safety Goggles', ability: 'Liquid Voice', moves: ['Moonblast', 'Hyper Voice', 'Haze', 'Protect'], nature: 'Modest', evs: sp(18, 0, 9, 14, 1, 24), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Assault Vest', ability: 'Intimidate', moves: ['Flare Blitz', 'Darkest Lariat', 'U-turn', 'Fake Out'], nature: 'Adamant', evs: sp(32, 15, 1, 0, 1, 17), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Rage Powder', 'Strength Sap', 'Trick Room'], nature: 'Bold', evs: sp(30, 0, 24, 1, 10, 1), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-joseph-froslass-palafin',
    name: 'Froslass-M + Palafin Hero',
    description: 'Mega Froslass Aurora Veil in Snow. Palafin Hero Jet Punch + Wave Crash. Kingambit Defiant + Swords Dance. Kommo-o Body Press. Clefable Follow Me.',
    archetype: 'Weather (Snow) + Mega',
    tags: ['weather-snow', 'mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Joseph Ugarte',
    source: 'https://youtu.be/DAwnCskX_uI',
    pokemon: [
      { species: 'Froslass', item: 'Froslassite', ability: 'Snow Cloak', moves: ['Blizzard', 'Shadow Ball', 'Aurora Veil', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Palafin', item: 'Mystic Water', ability: 'Zero to Hero', moves: ['Jet Punch', 'Wave Crash', 'Haze', 'Protect'], nature: 'Adamant', evs: sp(30, 32, 1, 0, 1, 2), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Black Glasses', ability: 'Defiant', moves: ['Kowtow Cleave', 'Swords Dance', 'Sucker Punch', 'Protect'], nature: 'Adamant', evs: sp(31, 32, 1, 0, 1, 1), ivs: ivs31, level: 50 },
      { species: 'Arcanine-Hisui', item: 'Clear Amulet', ability: 'Intimidate', moves: ['Flare Blitz', 'Rock Slide', 'Howl', 'Protect'], nature: 'Adamant', evs: sp(32, 15, 1, 0, 1, 17), ivs: ivs31, level: 50 },
      { species: 'Kommo-o', item: 'Leftovers', ability: 'Overcoat', moves: ['Flamethrower', 'Iron Defense', 'Body Press', 'Protect'], nature: 'Bold', evs: sp(26, 0, 25, 1, 12, 2), ivs: ivs31, level: 50 },
      { species: 'Clefable', item: 'Sitrus Berry', ability: 'Unaware', moves: ['Moonblast', 'Thunder Wave', 'Follow Me', 'Protect'], nature: 'Bold', evs: sp(30, 0, 27, 1, 7, 1), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-joseph-gardevoir-tr',
    name: 'Gardevoir-M TR (Ugarte)',
    description: 'Mega Gardevoir Trick Room setter. Archaludon Power Herb Electro Shot + Draco Meteor. Sneasler + Incineroar Fake Out support. Garchomp Life Orb cleaner.',
    archetype: 'Semi-Trick Room + Mega',
    tags: ['mega-focused', 'semi-trick-room', 'tailwind'],
    format: 'season-m1',
    author: 'Joseph Ugarte',
    source: 'https://youtu.be/DAwnCskX_uI',
    pokemon: [
      { species: 'Gardevoir', item: 'Gardevoirite', ability: 'Telepathy', moves: ['Psychic', 'Hyper Voice', 'Trick Room', 'Protect'], nature: 'Modest', evs: sp(32, 0, 16, 15, 1, 2), ivs: ivs31, level: 50 },
      { species: 'Archaludon', item: 'Power Herb', ability: 'Sturdy', moves: ['Flash Cannon', 'Draco Meteor', 'Electro Shot', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'White Herb', ability: 'Unburden', moves: ['Dire Claw', 'Close Combat', 'Fake Out', 'Protect'], nature: 'Adamant', evs: sp(1, 20, 27, 0, 1, 17), ivs: ivs31, level: 50 },
      { species: 'Vivillon', item: 'Focus Sash', ability: 'Compound Eyes', moves: ['Hurricane', 'Sleep Powder', 'Tailwind', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Assault Vest', ability: 'Intimidate', moves: ['Flare Blitz', 'Darkest Lariat', 'U-turn', 'Fake Out'], nature: 'Adamant', evs: sp(31, 15, 9, 0, 1, 10), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', moves: ['Dragon Claw', 'Stomping Tantrum', 'Earthquake', 'Protect'], nature: 'Jolly', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-joseph-metagross',
    name: 'Mega Metagross Balance (Ugarte)',
    description: 'Mega Metagross Tough Claws attacker. Gyarados Intimidate + Thunder Wave. Sneasler Unburden. Tyranitar sand support. Volcarona Quiver Dance + Rage Powder.',
    archetype: 'Mega-Focused + Balanced',
    tags: ['mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Joseph Ugarte',
    source: 'https://youtu.be/DAwnCskX_uI',
    pokemon: [
      { species: 'Metagross', item: 'Metagrossite', ability: 'Tough Claws', moves: ['Heavy Slam', 'Psychic Fangs', 'Stomping Tantrum', 'Protect'], nature: 'Jolly', evs: sp(1, 31, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Gyarados', item: 'Safety Goggles', ability: 'Intimidate', moves: ['Waterfall', 'Thunder Wave', 'Helping Hand', 'Taunt'], nature: 'Adamant', evs: sp(32, 5, 4, 0, 7, 18), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'White Herb', ability: 'Unburden', moves: ['Dire Claw', 'Close Combat', 'Coaching', 'Fake Out'], nature: 'Adamant', evs: sp(1, 20, 27, 0, 1, 17), ivs: ivs31, level: 50 },
      { species: 'Tyranitar', item: 'Clear Amulet', ability: 'Sand Stream', moves: ['Rock Slide', 'Low Kick', 'Crunch', 'Protect'], nature: 'Adamant', evs: sp(16, 16, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Volcarona', item: 'Sitrus Berry', ability: 'Flame Body', moves: ['Heat Wave', 'Quiver Dance', 'Bug Buzz', 'Protect'], nature: 'Timid', evs: sp(28, 0, 12, 1, 1, 24), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Occa Berry', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Rage Powder', 'Strength Sap', 'Trick Room'], nature: 'Bold', evs: sp(29, 0, 24, 0, 13, 0), ivs: ivs31, level: 50 },
    ],
  },
  // ── Phillip Wingett ───────────────────────────────────────
  {
    id: 'community-phillip-kangaskhan-tr',
    name: 'Mega Kangaskhan TR',
    description: 'Mega Kangaskhan Parental Bond Fake Out + Power-Up Punch. Sinistcha Trick Room. Palafin Hero Jet Punch. Archaludon Stamina AV. Pelipper Drizzle + Tailwind backup.',
    archetype: 'Trick Room + Mega',
    tags: ['trick-room', 'mega-focused', 'weather-rain'],
    format: 'season-m1',
    author: 'Phillip Wingett',
    source: 'https://youtu.be/iwOr0DOJXYs',
    pokemon: [
      { species: 'Kangaskhan', item: 'Kangaskhanite', ability: 'Scrappy', moves: ['Fake Out', 'Power-Up Punch', 'Sucker Punch', 'Double-Edge'], nature: 'Adamant', evs: sp(32, 5, 0, 0, 25, 4), ivs: ivs31, level: 50 },
      { species: 'Palafin', item: 'Leftovers', ability: 'Zero to Hero', moves: ['Protect', 'Bulk Up', 'Drain Punch', 'Jet Punch'], nature: 'Adamant', evs: sp(32, 0, 1, 0, 31, 2), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Life Dew', 'Rage Powder', 'Trick Room', 'Matcha Gotcha'], nature: 'Bold', evs: sp(32, 0, 32, 1, 0, 1), ivs: ivs31, level: 50 },
      { species: 'Glimmora', item: 'Power Herb', ability: 'Toxic Debris', moves: ['Spiky Shield', 'Earth Power', 'Sludge Bomb', 'Meteor Beam'], nature: 'Modest', evs: sp(1, 0, 0, 32, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Archaludon', item: 'Assault Vest', ability: 'Stamina', moves: ['Body Press', 'Electro Shot', 'Flash Cannon', 'Dragon Pulse'], nature: 'Modest', evs: sp(32, 0, 0, 6, 20, 8), ivs: ivs31, level: 50 },
      { species: 'Pelipper', item: 'Focus Sash', ability: 'Drizzle', moves: ['Wide Guard', 'Tailwind', 'Weather Ball', 'Hurricane'], nature: 'Timid', evs: sp(1, 0, 0, 32, 1, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-phillip-tatsugiri-curly',
    name: 'Mega Tatsugiri (Curly) Commander',
    description: 'Mega Tatsugiri Curly Commander + Draco Meteor. Dondozo Order Up sweeper. Sneasler Fake Out + Coaching. Dragonite Extreme Speed. Glimmora Meteor Beam.',
    archetype: 'Commander + Mega',
    tags: ['mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Phillip Wingett',
    source: 'https://youtu.be/Ir817c8Ibxk',
    pokemon: [
      { species: 'Tatsugiri', item: 'Tatsugirinite', ability: 'Commander', moves: ['Protect', 'Icy Wind', 'Muddy Water', 'Draco Meteor'], nature: 'Timid', evs: sp(1, 0, 1, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Dondozo', item: 'Leftovers', ability: 'Unaware', moves: ['Protect', 'Order Up', 'Earthquake', 'Wave Crash'], nature: 'Adamant', evs: sp(0, 32, 1, 0, 3, 30), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'Focus Sash', ability: 'Unburden', moves: ['Fake Out', 'Coaching', 'Dire Claw', 'Close Combat'], nature: 'Jolly', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Dragonite', item: 'Choice Band', ability: 'Inner Focus', moves: ['Extreme Speed', 'Outrage', 'Rock Slide', 'Low Kick'], nature: 'Adamant', evs: sp(20, 32, 1, 0, 0, 13), ivs: ivs31, level: 50 },
      { species: 'Glimmora', item: 'Power Herb', ability: 'Toxic Debris', moves: ['Spiky Shield', 'Mortal Spin', 'Earth Power', 'Meteor Beam'], nature: 'Timid', evs: sp(1, 0, 0, 32, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Garganacl', item: 'Chople Berry', ability: 'Purifying Salt', moves: ['Protect', 'Recover', 'Stealth Rock', 'Salt Cure'], nature: 'Careful', evs: sp(32, 0, 3, 0, 30, 1), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-phillip-tatsugiri-droopy',
    name: 'Mega Tatsugiri (Droopy) Commander',
    description: 'Mega Tatsugiri Droopy Commander variant. Dondozo Yawn + Order Up. Chesnaught Bulletproof Leech Seed stall. Dragonite Scale Shot. Glimmora Meteor Beam.',
    archetype: 'Commander + Mega',
    tags: ['mega-focused', 'balanced'],
    format: 'season-m1',
    author: 'Phillip Wingett',
    source: 'https://youtu.be/Ir817c8Ibxk',
    pokemon: [
      { species: 'Tatsugiri', item: 'Tatsugirinite', ability: 'Commander', moves: ['Protect', 'Icy Wind', 'Muddy Water', 'Draco Meteor'], nature: 'Timid', evs: sp(5, 0, 1, 32, 0, 28), ivs: ivs31, level: 50 },
      { species: 'Dondozo', item: 'Leftovers', ability: 'Unaware', moves: ['Protect', 'Yawn', 'Order Up', 'Wave Crash'], nature: 'Careful', evs: sp(15, 16, 1, 0, 32, 2), ivs: ivs31, level: 50 },
      { species: 'Chesnaught', item: 'Kee Berry', ability: 'Bulletproof', moves: ['Spiky Shield', 'Leech Seed', 'Synthesis', 'Body Press'], nature: 'Bold', evs: sp(32, 0, 28, 0, 4, 2), ivs: ivs31, level: 50 },
      { species: 'Dragonite', item: 'Loaded Dice', ability: 'Multiscale', moves: ['Protect', 'Haze', 'Low Kick', 'Scale Shot'], nature: 'Adamant', evs: sp(19, 32, 0, 0, 1, 14), ivs: ivs31, level: 50 },
      { species: 'Glimmora', item: 'Power Herb', ability: 'Toxic Debris', moves: ['Spiky Shield', 'Mortal Spin', 'Earth Power', 'Meteor Beam'], nature: 'Timid', evs: sp(1, 0, 0, 32, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Garganacl', item: 'Chople Berry', ability: 'Purifying Salt', moves: ['Protect', 'Recover', 'Stealth Rock', 'Salt Cure'], nature: 'Careful', evs: sp(32, 0, 3, 0, 30, 1), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-phillip-crabominable-tr',
    name: 'Mega Crabominable Trick Room',
    description: 'Mega Crabominable Hyper Cutter TR sweeper. Torkoal Choice Specs Eruption in sun. Hatterene Magic Bounce TR setter. Farigiraf Imprison TR. Mimikyu Disguise SD.',
    archetype: 'Trick Room + Sun',
    tags: ['trick-room', 'mega-focused', 'weather-sun'],
    format: 'season-m1',
    author: 'Phillip Wingett',
    source: 'https://youtu.be/5Gsikph-Krk',
    pokemon: [
      { species: 'Crabominable', item: 'Crabominite', ability: 'Hyper Cutter', moves: ['Protect', 'Upper Hand', 'Ice Spinner', 'Superpower'], nature: 'Brave', evs: sp(32, 32, 1, 0, 1, 0), ivs: ivs31, level: 50 },
      { species: 'Torkoal', item: 'Choice Specs', ability: 'Drought', moves: ['Eruption', 'Heat Crash', 'Solar Beam', 'Earth Power'], nature: 'Quiet', evs: sp(32, 0, 1, 32, 1, 0), ivs: ivs31, level: 50 },
      { species: 'Hatterene', item: 'Focus Sash', ability: 'Magic Bounce', moves: ['Protect', 'Trick Room', 'Dazzling Gleam', 'Psychic'], nature: 'Quiet', evs: sp(32, 0, 1, 32, 1, 0), ivs: ivs31, level: 50 },
      { species: 'Maushold', item: 'Chople Berry', ability: 'Friend Guard', moves: ['Protect', 'Taunt', 'Follow Me', 'U-turn'], nature: 'Jolly', evs: sp(32, 0, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Farigiraf', item: 'Sitrus Berry', ability: 'Armor Tail', moves: ['Trick Room', 'Imprison', 'Psychic', 'Hyper Voice'], nature: 'Quiet', evs: sp(23, 0, 9, 10, 24, 0), ivs: ivs31, level: 50 },
      { species: 'Mimikyu', item: 'Life Orb', ability: 'Disguise', moves: ['Trick Room', 'Swords Dance', 'Play Rough', 'Shadow Claw'], nature: 'Brave', evs: sp(32, 32, 1, 0, 1, 0), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-phillip-charizard-sun',
    name: 'Charizard-Y Sun (Wingett)',
    description: 'Charizard-Y Drought + Tailwind. Venusaur Chlorophyll. Maushold Follow Me. Dragonite Extreme Speed. Aegislash Wide Guard. Garchomp Life Orb spread.',
    archetype: 'Weather (Sun) + Tailwind',
    tags: ['weather-sun', 'tailwind', 'balanced'],
    format: 'season-m1',
    author: 'Phillip Wingett',
    source: 'https://youtu.be/1ZqILKuve_8',
    pokemon: [
      { species: 'Charizard', item: 'Charizardite Y', ability: 'Drought', moves: ['Protect', 'Tailwind', 'Focus Blast', 'Heat Wave'], nature: 'Timid', evs: sp(1, 0, 1, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Venusaur', item: 'Focus Sash', ability: 'Chlorophyll', moves: ['Protect', 'Sleep Powder', 'Sludge Bomb', 'Giga Drain'], nature: 'Timid', evs: sp(1, 0, 0, 32, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', moves: ['Protect', 'Stomping Tantrum', 'Earthquake', 'Dragon Claw'], nature: 'Jolly', evs: sp(0, 32, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Maushold', item: 'Safety Goggles', ability: 'Friend Guard', moves: ['Protect', 'Follow Me', 'Taunt', 'Super Fang'], nature: 'Timid', evs: sp(32, 0, 9, 0, 1, 24), ivs: ivs31, level: 50 },
      { species: 'Dragonite', item: 'Loaded Dice', ability: 'Multiscale', moves: ['Protect', 'Haze', 'Extreme Speed', 'Scale Shot'], nature: 'Adamant', evs: sp(19, 32, 0, 0, 1, 14), ivs: ivs31, level: 50 },
      { species: 'Aegislash', item: 'Leftovers', ability: 'Stance Change', moves: ["King's Shield", 'Wide Guard', 'Shadow Ball', 'Flash Cannon'], nature: 'Modest', evs: sp(32, 0, 0, 10, 23, 1), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-phillip-sceptile',
    name: 'Mega Sceptile Lightning Rod',
    description: 'Mega Sceptile Lightning Rod absorbs Electric. Rotom-Heat Choice Scarf Trick. Talonflame Gale Wings Tailwind. Gardevoir Imprison TR. Mamoswine Ice Shard priority.',
    archetype: 'Mega-Focused + Tailwind',
    tags: ['mega-focused', 'tailwind', 'balanced'],
    format: 'season-m1',
    author: 'Phillip Wingett',
    source: 'https://youtu.be/PkhLXqUG11Q',
    pokemon: [
      { species: 'Sceptile', item: 'Sceptilite', ability: 'Lightning Rod', moves: ['Detect', 'Focus Blast', 'Dragon Pulse', 'Leaf Storm'], nature: 'Timid', evs: sp(1, 0, 0, 32, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Rotom-Heat', item: 'Choice Scarf', ability: 'Levitate', moves: ['Volt Switch', 'Discharge', 'Overheat', 'Trick'], nature: 'Timid', evs: sp(1, 0, 0, 32, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Talonflame', item: 'Life Orb', ability: 'Gale Wings', moves: ['Tailwind', 'Upper Hand', 'Flare Blitz', 'Brave Bird'], nature: 'Jolly', evs: sp(1, 32, 0, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Gardevoir', item: 'Focus Sash', ability: 'Telepathy', moves: ['Trick Room', 'Imprison', 'Dazzling Gleam', 'Expanding Force'], nature: 'Timid', evs: sp(1, 0, 1, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Mamoswine', item: 'Assault Vest', ability: 'Oblivious', moves: ['Ice Shard', 'Rock Slide', 'Icicle Crash', 'Earthquake'], nature: 'Adamant', evs: sp(20, 32, 1, 0, 0, 13), ivs: ivs31, level: 50 },
      { species: 'Gyarados', item: 'Clear Amulet', ability: 'Intimidate', moves: ['Protect', 'Dragon Dance', 'Earthquake', 'Waterfall'], nature: 'Jolly', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-phillip-metagross-sand',
    name: 'Mega Metagross Sand (Wingett)',
    description: 'Mega Metagross Tough Claws. Talonflame Gale Wings Tailwind. Tyranitar sand + Garchomp Sand Veil scarf. Milotic Competitive pivot. Meowscarada Sucker Punch.',
    archetype: 'Weather (Sand) + Mega',
    tags: ['weather-sand', 'mega-focused', 'tailwind'],
    format: 'season-m1',
    author: 'Phillip Wingett',
    source: 'https://youtu.be/a39g27E4aNI',
    pokemon: [
      { species: 'Metagross', item: 'Metagrossite', ability: 'Tough Claws', moves: ['Protect', 'Earthquake', 'Heavy Slam', 'Ice Punch'], nature: 'Jolly', evs: sp(1, 32, 0, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Talonflame', item: 'Covert Cloak', ability: 'Gale Wings', moves: ['Tailwind', 'Taunt', 'Flare Blitz', 'Brave Bird'], nature: 'Jolly', evs: sp(1, 32, 0, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Tyranitar', item: 'Assault Vest', ability: 'Sand Stream', moves: ['Rock Slide', 'Knock Off', 'Low Kick', 'Ice Punch'], nature: 'Adamant', evs: sp(28, 32, 1, 0, 0, 5), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Choice Scarf', ability: 'Sand Veil', moves: ['Earthquake', 'Stomping Tantrum', 'Rock Slide', 'Dragon Rush'], nature: 'Adamant', evs: sp(0, 32, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Milotic', item: 'Sitrus Berry', ability: 'Competitive', moves: ['Recover', 'Haze', 'Ice Beam', 'Scald'], nature: 'Calm', evs: sp(32, 0, 0, 6, 26, 2), ivs: ivs31, level: 50 },
      { species: 'Meowscarada', item: 'Focus Sash', ability: 'Overgrow', moves: ['Sucker Punch', 'Triple Axel', 'Knock Off', 'Flower Trick'], nature: 'Adamant', evs: sp(1, 32, 0, 0, 1, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-phillip-froslass-zoroark',
    name: 'Froslass-M + Zoroark-H Illusion',
    description: 'Mega Froslass Aurora Veil + Zoroark-H Illusion deception. Sneasler Fake Out. Dragonite behind the Veil. Whimsicott Tailwind backup.',
    archetype: 'Weather (Snow) + Mega',
    tags: ['weather-snow', 'mega-focused', 'tailwind'],
    format: 'season-m1',
    author: 'Phillip Wingett',
    source: 'https://www.youtube.com/watch?v=yW1upPoutbE',
    pokemon: [
      { species: 'Froslass', item: 'Froslassite', ability: 'Cursed Body', moves: ['Protect', 'Aurora Veil', 'Shadow Ball', 'Blizzard'], nature: 'Timid', evs: sp(4, 0, 1, 32, 0, 29), ivs: ivs31, level: 50 },
      { species: 'Rotom', item: 'Leftovers', ability: 'Levitate', moves: ['Protect', 'Helping Hand', 'Thunderbolt', 'Hydro Pump'], nature: 'Bold', evs: sp(32, 0, 8, 0, 3, 23), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'Safety Goggles', ability: 'Poison Touch', moves: ['Protect', 'Fake Out', 'Dire Claw', 'Close Combat'], nature: 'Jolly', evs: sp(0, 32, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Zoroark-Hisui', item: 'Choice Specs', ability: 'Illusion', moves: ['Hyper Voice', 'Hyper Beam', 'Bitter Malice', 'Focus Blast'], nature: 'Timid', evs: sp(1, 0, 0, 32, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Protect', 'Tailwind', 'Helping Hand', 'Moonblast'], nature: 'Timid', evs: sp(1, 0, 1, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Dragonite', item: 'Loaded Dice', ability: 'Multiscale', moves: ['Protect', 'Haze', 'Extreme Speed', 'Scale Shot'], nature: 'Adamant', evs: sp(19, 32, 0, 0, 1, 14), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'community-phillip-aerodactyl',
    name: 'Mega Aerodactyl Tailwind',
    description: 'Mega Aerodactyl Tough Claws Tailwind setter + Rock Slide spread. Grimmsnarl Screens. Zoroark-H Illusion. Sinistcha Hospitality. Garchomp Life Orb. Rotom pivot.',
    archetype: 'Mega-Focused + Tailwind',
    tags: ['mega-focused', 'tailwind', 'balanced'],
    format: 'season-m1',
    author: 'Phillip Wingett',
    source: 'https://www.youtube.com/watch?v=ZivoBfhRN-M',
    pokemon: [
      { species: 'Aerodactyl', item: 'Aerodactylite', ability: 'Tough Claws', moves: ['Protect', 'Tailwind', 'Rock Slide', 'Dual Wingbeat'], nature: 'Adamant', evs: sp(32, 5, 0, 0, 8, 21), ivs: ivs31, level: 50 },
      { species: 'Grimmsnarl', item: 'Light Clay', ability: 'Prankster', moves: ['Light Screen', 'Reflect', 'Thunder Wave', 'Spirit Break'], nature: 'Careful', evs: sp(32, 0, 3, 0, 25, 6), ivs: ivs31, level: 50 },
      { species: 'Zoroark-Hisui', item: 'Choice Specs', ability: 'Illusion', moves: ['Hyper Voice', 'Hyper Beam', 'Bitter Malice', 'Hex'], nature: 'Timid', evs: sp(1, 0, 1, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Rocky Helmet', ability: 'Hospitality', moves: ['Protect', 'Rage Powder', 'Life Dew', 'Matcha Gotcha'], nature: 'Bold', evs: sp(32, 0, 31, 0, 1, 2), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', moves: ['Protect', 'Rock Slide', 'Dragon Claw', 'Earthquake'], nature: 'Jolly', evs: sp(0, 32, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Rotom', item: 'Sitrus Berry', ability: 'Levitate', moves: ['Parting Shot', 'Thunderbolt', 'Discharge', 'Hydro Pump'], nature: 'Bold', evs: sp(31, 0, 23, 0, 10, 2), ivs: ivs31, level: 50 },
    ],
  },
  // ── TGemVGC ───────────────────────────────────────────────
  {
    id: 'community-tgem-salamence-tatsugiri',
    name: 'Dual Mega: Salamence + Tatsugiri',
    description: 'Mega Salamence Tailwind + Mega Tatsugiri Commander with Dondozo. Ninetales-A Aurora Veil. Sneasler Fake Out. Dragapult Choice Specs special attacker.',
    archetype: 'Dual Mega + Commander',
    tags: ['mega-focused', 'tailwind', 'balanced'],
    format: 'season-m1',
    author: 'TGemVGC',
    source: 'https://x.com/Gem2099Alt/status/2040328943329501386',
    pokemon: [
      { species: 'Salamence', item: 'Salamencite', ability: 'Intimidate', moves: ['Double-Edge', 'Protect', 'Hyper Voice', 'Tailwind'], nature: 'Naive', evs: sp(0, 1, 1, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Tatsugiri', item: 'Tatsugirinite', ability: 'Commander', moves: ['Muddy Water', 'Protect', 'Draco Meteor', 'Hydro Pump'], nature: 'Timid', evs: sp(0, 0, 1, 32, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Dondozo', item: 'Leftovers', ability: 'Unaware', moves: ['Protect', 'Order Up', 'Wave Crash', 'Earthquake'], nature: 'Adamant', evs: sp(32, 32, 1, 0, 1, 0), ivs: ivs31, level: 50 },
      { species: 'Ninetales-Alola', item: 'Light Clay', ability: 'Snow Warning', moves: ['Blizzard', 'Aurora Veil', 'Protect', 'Icy Wind'], nature: 'Timid', evs: sp(1, 0, 1, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'White Herb', ability: 'Unburden', moves: ['Dire Claw', 'Close Combat', 'Fake Out', 'Protect'], nature: 'Adamant', evs: sp(0, 32, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Dragapult', item: 'Choice Specs', ability: 'Clear Body', moves: ['Draco Meteor', 'Dragon Pulse', 'Shadow Ball', 'Fire Blast'], nature: 'Timid', evs: sp(0, 0, 1, 32, 1, 32), ivs: ivs31, level: 50 },
    ],
  },
  // ── cukicumkin ────────────────────────────────────────────
  {
    id: 'community-cukicumkin-metagross',
    name: 'Mega Metagross Tailwind',
    description: 'Mega Metagross Adamant physical powerhouse. Whimsicott Prankster Tailwind. Sneasler Fake Out + Coaching. Primarina AV Liquid Voice. Garchomp Choice Band.',
    archetype: 'Mega-Focused + Tailwind',
    tags: ['mega-focused', 'tailwind', 'balanced'],
    format: 'season-m1',
    author: 'cukicumkin',
    source: 'https://x.com/cukicumkin/status/2040241810136596522',
    pokemon: [
      { species: 'Metagross', item: 'Metagrossite', ability: 'Clear Body', moves: ['Heavy Slam', 'Psychic Fangs', 'Ice Punch', 'Protect'], nature: 'Adamant', evs: sp(31, 32, 0, 0, 0, 3), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Covert Cloak', ability: 'Prankster', moves: ['Tailwind', 'Energy Ball', 'Taunt', 'Protect'], nature: 'Bold', evs: sp(32, 0, 32, 2, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'Focus Sash', ability: 'Unburden', moves: ['Fake Out', 'Dire Claw', 'Coaching', 'Close Combat'], nature: 'Adamant', evs: sp(0, 32, 0, 0, 2, 32), ivs: ivs31, level: 50 },
      { species: 'Primarina', item: 'Assault Vest', ability: 'Liquid Voice', moves: ['Hyper Voice', 'Moonblast', 'Ice Beam', 'Psychic'], nature: 'Modest', evs: sp(32, 0, 15, 17, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Choice Band', ability: 'Rough Skin', moves: ['Earthquake', 'Rock Slide', 'Dragon Claw', 'Poison Jab'], nature: 'Jolly', evs: sp(0, 32, 0, 0, 2, 32), ivs: ivs31, level: 50 },
      { species: 'Arcanine', item: 'Life Orb', ability: 'Intimidate', moves: ['Flare Blitz', 'Extreme Speed', 'Protect', 'Roar'], nature: 'Adamant', evs: sp(14, 20, 0, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  // ── Top Ladder (Unknown) ──────────────────────────────────
  {
    id: 'community-top-ladder-tatsugiri-gengar',
    name: 'Top Ladder: Tatsugiri + Mega Gengar',
    description: 'Top ladder team. Tatsugiri Commander + Dondozo combo. Mega Gengar Shadow Tag. Pelipper rain + Archaludon Electro Shot. Weavile Fake Out + Beat Up.',
    archetype: 'Commander + Perish Trap',
    tags: ['mega-focused', 'weather-rain', 'balanced'],
    format: 'season-m1',
    source: 'Top ladder team',
    pokemon: [
      { species: 'Dondozo', item: 'Leftovers', ability: 'Unaware', moves: ['Wave Crash', 'Earthquake', 'Order Up', 'Protect'], nature: 'Adamant', evs: sp(0, 32, 1, 0, 1, 32), ivs: ivs31, level: 50 },
      { species: 'Tatsugiri', item: 'Safety Goggles', ability: 'Commander', moves: ['Draco Meteor', 'Muddy Water', 'Helping Hand', 'Protect'], nature: 'Modest', evs: sp(32, 0, 13, 10, 0, 11), ivs: ivs31, level: 50 },
      { species: 'Pelipper', item: 'Choice Scarf', ability: 'Drizzle', moves: ['Muddy Water', 'Hurricane', 'U-turn', 'Tailwind'], nature: 'Timid', evs: sp(1, 0, 1, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Archaludon', item: 'Assault Vest', ability: 'Stamina', moves: ['Dragon Pulse', 'Electro Shot', 'Flash Cannon', 'Body Press'], nature: 'Modest', evs: sp(32, 0, 4, 6, 0, 24), ivs: ivs31, level: 50 },
      { species: 'Weavile', item: 'Focus Sash', ability: 'Pickpocket', moves: ['Knock Off', 'Triple Axel', 'Beat Up', 'Fake Out'], nature: 'Jolly', evs: sp(1, 32, 1, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Gengar', item: 'Gengarite', ability: 'Shadow Tag', moves: ['Sludge Bomb', 'Shadow Ball', 'Substitute', 'Protect'], nature: 'Timid', evs: sp(1, 0, 1, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // LIMITLESS VGC — Pokemon Champions First Tour ($500)
  // Content Creator Teams (Top 4)
  // ═══════════════════════════════════════════════════════

  // ── 1st Place — gamblingvgc92 (13-2) ──────────────────
  {
    id: 'limitless-gamblingvgc92-delphox',
    name: 'Mega Delphox + Defiant Kingambit',
    description: '1st place Pokemon Champions First Tour. Clefable Follow Me + Kingambit Swords Dance core, with Mega Delphox for Fire/Psychic coverage. Dragonite provides priority Extreme Speed and Haze.',
    archetype: 'Hyper Offense',
    tags: ['hyper-offense', 'mega-focused', 'fake-out'],
    format: 'season-m1',
    author: 'gamblingvgc92',
    source: 'https://play.limitlesstcg.com/tournament/69c6a52bd478313a15a33fd4/player/gamblingvgc92/teamlist',
    pokemon: [
      { species: 'Sneasler', item: 'Focus Sash', ability: 'Unburden', moves: ['Dire Claw', 'Close Combat', 'Fake Out', 'Protect'], nature: 'Jolly', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Black Glasses', ability: 'Defiant', moves: ['Swords Dance', 'Sucker Punch', 'Kowtow Cleave', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Clefable', item: 'Sitrus Berry', ability: 'Unaware', moves: ['Follow Me', 'Helping Hand', 'Moonblast', 'Protect'], nature: 'Bold', evs: sp(32, 0, 32, 0, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Delphox', item: 'Delphoxite', ability: 'Blaze', moves: ['Heat Wave', 'Substitute', 'Psychic', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Dragonite', item: 'Lum Berry', ability: 'Multiscale', moves: ['Scale Shot', 'Extreme Speed', 'Haze', 'Protect'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Basculegion', item: 'Choice Scarf', ability: 'Adaptability', moves: ['Wave Crash', 'Flip Turn', 'Last Respects', 'Aqua Jet'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },

  // ── 2nd Place — BIlllmads (12-3) ──────────────────────
  {
    id: 'limitless-billlmads-charizard-y',
    name: 'Charizard Y Sun + Farigiraf Imprison',
    description: '2nd place Pokemon Champions First Tour. Mega Charizard Y sun with Farigiraf Imprison to block opposing Trick Room. Sneasler + Kingambit physical offensive core.',
    archetype: 'Weather (Sun)',
    tags: ['weather-sun', 'mega-focused', 'fake-out'],
    format: 'season-m1',
    author: 'BIlllmads',
    source: 'https://play.limitlesstcg.com/tournament/69c6a52bd478313a15a33fd4/player/BIlllmads/teamlist',
    pokemon: [
      { species: 'Charizard', item: 'Charizardite Y', ability: 'Solar Power', moves: ['Heat Wave', 'Overheat', 'Solar Beam', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Moonblast', 'Tailwind', 'Protect', 'Encore'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Farigiraf', item: 'Sitrus Berry', ability: 'Armor Tail', moves: ['Hyper Voice', 'Psychic', 'Trick Room', 'Imprison'], nature: 'Quiet', evs: sp(32, 0, 23, 2, 9, 0), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'White Herb', ability: 'Unburden', moves: ['Close Combat', 'Fake Out', 'Dire Claw', 'Protect'], nature: 'Jolly', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Choice Scarf', ability: 'Rough Skin', moves: ['Dragon Claw', 'Rock Slide', 'Earthquake', 'Stomping Tantrum'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Dread Plate', ability: 'Defiant', moves: ['Kowtow Cleave', 'Sucker Punch', 'Swords Dance', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
    ],
  },

  // ── 3rd Place — sempra (11-3) ─────────────────────────
  {
    id: 'limitless-sempra-kangaskhan',
    name: 'Mega Kangaskhan + Charizard Y Dual Mega',
    description: '3rd place Pokemon Champions First Tour. Dual Mega options with Kangaskhan for Fake Out pressure or Charizard Y for sun. Farigiraf provides Trick Room mode.',
    archetype: 'Balanced',
    tags: ['balanced', 'mega-focused', 'fake-out', 'semi-trick-room'],
    format: 'season-m1',
    author: 'sempra',
    source: 'https://play.limitlesstcg.com/tournament/69c6a52bd478313a15a33fd4/player/sempra/teamlist',
    pokemon: [
      { species: 'Charizard', item: 'Charizardite Y', ability: 'Blaze', moves: ['Weather Ball', 'Heat Wave', 'Solar Beam', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Moonblast', 'Tailwind', 'Sunny Day', 'Encore'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Basculegion', item: 'Choice Scarf', ability: 'Adaptability', moves: ['Wave Crash', 'Aqua Jet', 'Last Respects', 'Icy Wind'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Farigiraf', item: 'Sitrus Berry', ability: 'Armor Tail', moves: ['Psychic', 'Hyper Voice', 'Helping Hand', 'Trick Room'], nature: 'Quiet', evs: sp(32, 0, 23, 2, 9, 0), ivs: ivs31, level: 50 },
      { species: 'Kangaskhan', item: 'Kangaskhanite', ability: 'Scrappy', moves: ['Fake Out', 'Double-Edge', 'Drain Punch', 'Sucker Punch'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Sneasler', item: 'White Herb', ability: 'Unburden', moves: ['Fake Out', 'Close Combat', 'Dire Claw', 'Throat Chop'], nature: 'Jolly', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },

  // ── 4th Place — Wb_vg (11-3) ──────────────────────────
  {
    id: 'limitless-wb-floette-talonflame',
    name: 'Mega Floette + Talonflame Tailwind',
    description: '4th place Pokemon Champions First Tour. Mega Floette Calm Mind sweeper with Talonflame Tailwind and Maushold Friend Guard + Follow Me support. Primarina for Liquid Voice spread damage.',
    archetype: 'Tailwind',
    tags: ['tailwind', 'mega-focused', 'redirection'],
    format: 'season-m1',
    author: 'Wb_vg',
    source: 'https://play.limitlesstcg.com/tournament/69c6a52bd478313a15a33fd4/player/Wb_vg/teamlist',
    pokemon: [
      { species: 'Floette', item: 'Floettite', ability: 'Flower Veil', moves: ['Protect', 'Dazzling Gleam', 'Moonblast', 'Calm Mind'], nature: 'Bold', evs: sp(32, 0, 20, 14, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Talonflame', item: 'Focus Sash', ability: 'Gale Wings', moves: ['Protect', 'Brave Bird', 'Flare Blitz', 'Tailwind'], nature: 'Jolly', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Primarina', item: 'Fairy Feather', ability: 'Liquid Voice', moves: ['Protect', 'Moonblast', 'Dazzling Gleam', 'Hyper Voice'], nature: 'Modest', evs: sp(32, 0, 2, 32, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Maushold', item: 'Lum Berry', ability: 'Friend Guard', moves: ['Protect', 'Helping Hand', 'Follow Me', 'Super Fang'], nature: 'Jolly', evs: sp(32, 0, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'White Herb', ability: 'Rough Skin', moves: ['Protect', 'Dragon Claw', 'Earthquake', 'Stomping Tantrum'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Sitrus Berry', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Throat Chop', 'Parting Shot'], nature: 'Careful', evs: sp(32, 2, 0, 0, 32, 0), ivs: ivs31, level: 50 },
    ],
  },

  // ═══════════════════════════════════════════════════════
  // LIMITLESS VGC — Pokemon Champions First Tour ($500)
  // Community Teams (Unique Compositions)
  // ═══════════════════════════════════════════════════════

  // ── 8th Place — Kotori (10-3) — Perish Trap Rain ──────
  {
    id: 'community-kotori-perish-rain',
    name: 'Perish Trap Rain',
    description: 'Mega Gengar Shadow Tag traps opponents while Politoed sets rain and uses Perish Song. Palafin provides Zero to Hero power in rain. Kommo-o as a secondary win condition.',
    archetype: 'Weather (Rain)',
    tags: ['weather-rain', 'perish-trap', 'mega-focused'],
    format: 'season-m1',
    pokemon: [
      { species: 'Politoed', item: 'Leftovers', ability: 'Drizzle', moves: ['Protect', 'Weather Ball', 'Perish Song', 'Encore'], nature: 'Calm', evs: sp(32, 0, 2, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Gengar', item: 'Gengarite', ability: 'Cursed Body', moves: ['Perish Song', 'Disable', 'Shadow Ball', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Sitrus Berry', ability: 'Intimidate', moves: ['Fake Out', 'Parting Shot', 'Darkest Lariat', 'Protect'], nature: 'Careful', evs: sp(32, 2, 0, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Palafin', item: 'Mystic Water', ability: 'Zero to Hero', moves: ['Wave Crash', 'Jet Punch', 'Close Combat', 'Protect'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Moonblast', 'Protect', 'Tailwind', 'Encore'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Kommo-o', item: 'Dragon Fang', ability: 'Overcoat', moves: ['Clanging Scales', 'Clangorous Soul', 'Aura Sphere', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },

  // ── 10th Place — Snivy13 (10-2) — Snow Veil Offense ───
  {
    id: 'community-snivy-snow-veil',
    name: 'Aurora Veil Snow Offense',
    description: 'Alolan Ninetales sets Snow + Aurora Veil, Mega Floette sweeps behind screens. Kingambit Defiant core with Sinistcha redirection support.',
    archetype: 'Weather (Snow)',
    tags: ['weather-snow', 'screens', 'mega-focused'],
    format: 'season-m1',
    pokemon: [
      { species: 'Floette', item: 'Floettite', ability: 'Flower Veil', moves: ['Dazzling Gleam', 'Moonblast', 'Calm Mind', 'Protect'], nature: 'Bold', evs: sp(32, 0, 20, 14, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Black Glasses', ability: 'Defiant', moves: ['Kowtow Cleave', 'Sucker Punch', 'Swords Dance', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Sitrus Berry', ability: 'Intimidate', moves: ['Flare Blitz', 'Throat Chop', 'Parting Shot', 'Fake Out'], nature: 'Careful', evs: sp(32, 2, 0, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Basculegion', item: 'Choice Scarf', ability: 'Adaptability', moves: ['Wave Crash', 'Flip Turn', 'Icy Wind', 'Last Respects'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Leftovers', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Rage Powder', 'Life Dew', 'Trick Room'], nature: 'Calm', evs: sp(32, 0, 2, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Ninetales-Alola', item: 'Focus Sash', ability: 'Snow Warning', moves: ['Blizzard', 'Icy Wind', 'Aurora Veil', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },

  // ── 11th Place — JoeUX9 (10-2) — Klefki Screens ──────
  {
    id: 'community-joeUX9-klefki-screens',
    name: 'Klefki Screens + Mega Tyranitar',
    description: 'Prankster Klefki sets dual screens for Mega Tyranitar to set up. Gyarados provides secondary Intimidate + Thunder Wave. Sinistcha Trick Room as backup speed control.',
    archetype: 'Balanced',
    tags: ['screens', 'weather-sand', 'mega-focused', 'semi-trick-room'],
    format: 'season-m1',
    pokemon: [
      { species: 'Klefki', item: 'Occa Berry', ability: 'Prankster', moves: ['Dazzling Gleam', 'Light Screen', 'Sunny Day', 'Reflect'], nature: 'Bold', evs: sp(32, 0, 32, 0, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Choice Scarf', ability: 'Rough Skin', moves: ['Dragon Claw', 'Stomping Tantrum', 'Earthquake', 'Rock Slide'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Tyranitar', item: 'Tyranitarite', ability: 'Sand Stream', moves: ['Rock Slide', 'Knock Off', 'Low Kick', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 0, 0, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Rotom-Heat', item: 'Passho Berry', ability: 'Levitate', moves: ['Overheat', 'Thunderbolt', 'Volt Switch', 'Protect'], nature: 'Modest', evs: sp(32, 0, 2, 32, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Gyarados', item: 'Lum Berry', ability: 'Intimidate', moves: ['Waterfall', 'Thunder Wave', 'Helping Hand', 'Taunt'], nature: 'Impish', evs: sp(32, 0, 32, 0, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Rage Powder', 'Strength Sap', 'Trick Room'], nature: 'Calm', evs: sp(32, 0, 2, 0, 32, 0), ivs: ivs31, level: 50 },
    ],
  },

  // ── 17th Place — DanSpunta (10-1) — Sand Corviknight ──
  {
    id: 'community-danspunta-sand-corviknight',
    name: 'Sand Rush + Corviknight Tailwind',
    description: 'Tyranitar + Excadrill sand core with Corviknight Mirror Armor providing Tailwind. Mega Floette and Sinistcha for Fairy/Grass defensive coverage.',
    archetype: 'Weather (Sand)',
    tags: ['weather-sand', 'tailwind', 'mega-focused'],
    format: 'season-m1',
    pokemon: [
      { species: 'Incineroar', item: 'Chople Berry', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Darkest Lariat', 'Parting Shot'], nature: 'Careful', evs: sp(32, 2, 0, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Floette', item: 'Floettite', ability: 'Flower Veil', moves: ['Moonblast', 'Draining Kiss', 'Calm Mind', 'Protect'], nature: 'Bold', evs: sp(32, 0, 20, 14, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Tyranitar', item: 'Choice Scarf', ability: 'Sand Stream', moves: ['Rock Slide', 'Knock Off', 'Breaking Swipe', 'Low Kick'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Excadrill', item: 'White Herb', ability: 'Sand Rush', moves: ['High Horsepower', 'Iron Head', 'Rock Slide', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Rage Powder', 'Strength Sap', 'Trick Room'], nature: 'Calm', evs: sp(32, 0, 2, 0, 32, 0), ivs: ivs31, level: 50 },
      { species: 'Corviknight', item: 'Occa Berry', ability: 'Mirror Armor', moves: ['Brave Bird', 'Iron Head', 'Bulk Up', 'Tailwind'], nature: 'Careful', evs: sp(32, 0, 2, 0, 32, 0), ivs: ivs31, level: 50 },
    ],
  },
];

/**
 * Popular 2-3 Pokemon cores for quick team building inspiration.
 */
export interface PokemonCore {
  id: string;
  name: string;
  description: string;
  tags: string[];
  pokemon: string[]; // Species names (for display)
  sets?: PokemonSet[]; // Full sets for "Add to Builder" (optional)
}

export const POPULAR_CORES: PokemonCore[] = [
  {
    id: 'sand-core', name: 'Sand Rush Core',
    description: 'Tyranitar sets sand, Excadrill doubles speed. Classic physical offense.',
    tags: ['weather-sand'], pokemon: ['Tyranitar', 'Excadrill'],
    sets: [
      { species: 'Tyranitar', item: 'Assault Vest', ability: 'Sand Stream', moves: ['Rock Slide', 'Crunch', 'Low Kick', 'Ice Punch'], nature: 'Adamant', evs: sp(32, 32, 0, 0, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Excadrill', item: 'Focus Sash', ability: 'Sand Rush', moves: ['High Horsepower', 'Iron Head', 'Rock Slide', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'rain-core', name: 'Rain + Steel Core',
    description: 'Pelipper sets rain. Archaludon fires instant Electro Shot. Basculegion sweeps with Swift Swim.',
    tags: ['weather-rain'], pokemon: ['Pelipper', 'Archaludon', 'Basculegion'],
    sets: [
      { species: 'Pelipper', item: 'Focus Sash', ability: 'Drizzle', moves: ['Hurricane', 'Weather Ball', 'Tailwind', 'Protect'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Archaludon', item: 'Assault Vest', ability: 'Stamina', moves: ['Flash Cannon', 'Electro Shot', 'Body Press', 'Dragon Pulse'], nature: 'Modest', evs: sp(32, 0, 0, 32, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Basculegion', item: 'Choice Band', ability: 'Swift Swim', moves: ['Wave Crash', 'Last Respects', 'Aqua Jet', 'Phantom Force'], nature: 'Adamant', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'sun-core', name: 'Sun Chlorophyll Core',
    description: 'Torkoal Drought + Venusaur Chlorophyll = doubled Speed and boosted Fire/Grass.',
    tags: ['weather-sun'], pokemon: ['Torkoal', 'Venusaur'],
    sets: [
      { species: 'Torkoal', item: 'Charcoal', ability: 'Drought', moves: ['Eruption', 'Heat Wave', 'Earth Power', 'Protect'], nature: 'Quiet', evs: sp(32, 0, 0, 32, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Venusaur', item: 'Life Orb', ability: 'Chlorophyll', moves: ['Giga Drain', 'Sludge Bomb', 'Earth Power', 'Protect'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'tr-core', name: 'Trick Room Core',
    description: 'Hatterene sets TR with Magic Bounce. Torkoal Eruption at full HP under TR devastates.',
    tags: ['trick-room'], pokemon: ['Hatterene', 'Torkoal'],
    sets: [
      { species: 'Hatterene', item: 'Leftovers', ability: 'Magic Bounce', moves: ['Trick Room', 'Dazzling Gleam', 'Psychic', 'Mystical Fire'], nature: 'Quiet', evs: sp(32, 0, 2, 32, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Torkoal', item: 'Charcoal', ability: 'Drought', moves: ['Eruption', 'Heat Wave', 'Earth Power', 'Protect'], nature: 'Quiet', evs: sp(32, 0, 0, 32, 2, 0), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'incineroar-core', name: 'Intimidate Pivot',
    description: 'Incineroar Fake Out + Parting Shot cycling. Pairs with almost anything.',
    tags: ['balanced'], pokemon: ['Incineroar'],
    sets: [
      { species: 'Incineroar', item: 'Safety Goggles', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'], nature: 'Careful', evs: sp(32, 2, 0, 0, 30, 2), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'defiant-core', name: 'Defiant Anti-Intimidate',
    description: 'Kingambit gains +2 Attack from Intimidate. Pair with your own Intimidate user to bait.',
    tags: ['hyper-offense'], pokemon: ['Kingambit', 'Incineroar'],
    sets: [
      { species: 'Kingambit', item: 'Assault Vest', ability: 'Defiant', moves: ['Sucker Punch', 'Iron Head', 'Kowtow Cleave', 'Low Kick'], nature: 'Adamant', evs: sp(32, 32, 0, 0, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Safety Goggles', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Knock Off', 'Parting Shot'], nature: 'Careful', evs: sp(32, 2, 0, 0, 30, 2), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'tailwind-core', name: 'Prankster Tailwind',
    description: 'Whimsicott guarantees Tailwind with Prankster priority. Garchomp outspeeds everything under Tailwind.',
    tags: ['tailwind'], pokemon: ['Whimsicott', 'Garchomp'],
    sets: [
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Tailwind', 'Moonblast', 'Encore', 'Helping Hand'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Garchomp', item: 'Life Orb', ability: 'Rough Skin', moves: ['Earthquake', 'Dragon Claw', 'Rock Slide', 'Protect'], nature: 'Jolly', evs: sp(0, 32, 2, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'farigiraf-tr', name: 'Armor Tail TR',
    description: 'Farigiraf blocks priority with Armor Tail while setting TR. Ursaluna sweeps with Guts + Facade.',
    tags: ['trick-room'], pokemon: ['Farigiraf', 'Ursaluna'],
    sets: [
      { species: 'Farigiraf', item: 'Leftovers', ability: 'Armor Tail', moves: ['Trick Room', 'Hyper Voice', 'Psychic', 'Protect'], nature: 'Quiet', evs: sp(32, 0, 2, 32, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Ursaluna', item: 'Flame Orb', ability: 'Guts', moves: ['Headlong Rush', 'Facade', 'Rock Slide', 'Protect'], nature: 'Brave', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'rotom-blastoise', name: 'Rotom + Mega Blastoise',
    description: '73.4% WR core. Heat Rotom + Mega Blastoise cover each other\'s weaknesses perfectly.',
    tags: ['mega-focused', 'balanced'], pokemon: ['Rotom-Heat', 'Blastoise'],
    sets: [
      { species: 'Rotom-Heat', item: 'Sitrus Berry', ability: 'Levitate', moves: ['Overheat', 'Thunderbolt', 'Will-O-Wisp', 'Protect'], nature: 'Modest', evs: sp(32, 0, 2, 10, 22, 0), ivs: ivs31, level: 50 },
      { species: 'Blastoise', item: 'Blastoisinite', ability: 'Torrent', moves: ['Water Spout', 'Ice Beam', 'Aura Sphere', 'Protect'], nature: 'Modest', evs: sp(32, 0, 2, 32, 0, 0), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'tsareena-dragapult', name: 'Queenly Majesty + Ghost',
    description: '73.4% WR core. Tsareena blocks priority with Queenly Majesty while Dragapult fires off unresisted attacks.',
    tags: ['hyper-offense'], pokemon: ['Tsareena', 'Dragapult'],
    sets: [
      { species: 'Tsareena', item: 'Assault Vest', ability: 'Queenly Majesty', moves: ['Power Whip', 'High Jump Kick', 'U-turn', 'Throat Chop'], nature: 'Jolly', evs: sp(32, 32, 0, 0, 2, 0), ivs: ivs31, level: 50 },
      { species: 'Dragapult', item: 'Choice Specs', ability: 'Infiltrator', moves: ['Shadow Ball', 'Draco Meteor', 'Flamethrower', 'Thunderbolt'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'dondozo-tatsugiri', name: 'Commander Combo',
    description: '58.6% WR. Tatsugiri Commander boosts Dondozo +2 all stats. Nearly unkillable.',
    tags: ['balanced'], pokemon: ['Dondozo', 'Tatsugiri'],
    sets: [
      { species: 'Dondozo', item: 'Leftovers', ability: 'Unaware', moves: ['Wave Crash', 'Order Up', 'Protect', 'Earthquake'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Tatsugiri', item: 'Focus Sash', ability: 'Commander', moves: ['Draco Meteor', 'Muddy Water', 'Icy Wind', 'Protect'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'froslass-dragonite', name: 'Aurora Veil + Dragon Dance',
    description: 'Mega Froslass sets Aurora Veil in snow. Dragonite Dragon Dances behind the Veil with Multiscale.',
    tags: ['weather-snow', 'mega-focused'], pokemon: ['Froslass', 'Dragonite'],
    sets: [
      { species: 'Froslass', item: 'Froslassite', ability: 'Cursed Body', moves: ['Aurora Veil', 'Blizzard', 'Shadow Ball', 'Protect'], nature: 'Timid', evs: sp(26, 0, 1, 9, 15, 15), ivs: ivs31, level: 50 },
      { species: 'Dragonite', item: 'Lum Berry', ability: 'Multiscale', moves: ['Dragon Dance', 'Dragon Claw', 'Extreme Speed', 'Protect'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  // ── Champions First Tour cores ─────────────────────────
  {
    id: 'sneasler-kingambit', name: 'Fake Out + Defiant',
    description: 'First Tour top 4 staple. Sneasler Fake Out pressure + Kingambit Sucker Punch / Swords Dance for fast physical breaks.',
    tags: ['hyper-offense', 'fake-out'], pokemon: ['Sneasler', 'Kingambit'],
    sets: [
      { species: 'Sneasler', item: 'White Herb', ability: 'Unburden', moves: ['Fake Out', 'Close Combat', 'Dire Claw', 'Protect'], nature: 'Jolly', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Kingambit', item: 'Black Glasses', ability: 'Defiant', moves: ['Kowtow Cleave', 'Sucker Punch', 'Swords Dance', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'charizard-whimsicott', name: 'Sun Tailwind',
    description: 'Classic sun + Tailwind pair used by First Tour 2nd and 3rd place. Whimsicott guarantees Tailwind while Charizard Y nukes with Heat Wave.',
    tags: ['weather-sun', 'tailwind', 'mega-focused'], pokemon: ['Charizard', 'Whimsicott'],
    sets: [
      { species: 'Charizard', item: 'Charizardite Y', ability: 'Solar Power', moves: ['Heat Wave', 'Overheat', 'Solar Beam', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Whimsicott', item: 'Focus Sash', ability: 'Prankster', moves: ['Moonblast', 'Tailwind', 'Encore', 'Protect'], nature: 'Timid', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'floette-sinistcha', name: 'Mega Fairy + Redirection',
    description: 'Mega Floette Calm Mind sweeper backed by Sinistcha Rage Powder redirection. Appeared across First Tour top 20 multiple times.',
    tags: ['mega-focused', 'redirection'], pokemon: ['Floette', 'Sinistcha'],
    sets: [
      { species: 'Floette', item: 'Floettite', ability: 'Flower Veil', moves: ['Moonblast', 'Draining Kiss', 'Calm Mind', 'Protect'], nature: 'Bold', evs: sp(32, 0, 20, 14, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Sinistcha', item: 'Sitrus Berry', ability: 'Hospitality', moves: ['Matcha Gotcha', 'Rage Powder', 'Strength Sap', 'Trick Room'], nature: 'Calm', evs: sp(32, 0, 2, 0, 32, 0), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'kingambit-incineroar', name: 'Defiant + Intimidate',
    description: 'First Tour staple pairing. Incineroar Intimidate baits opposing Intimidates to boost Kingambit through Defiant.',
    tags: ['balanced', 'intimidate', 'fake-out'], pokemon: ['Kingambit', 'Incineroar'],
    sets: [
      { species: 'Kingambit', item: 'Black Glasses', ability: 'Defiant', moves: ['Kowtow Cleave', 'Sucker Punch', 'Swords Dance', 'Protect'], nature: 'Adamant', evs: sp(32, 32, 2, 0, 0, 0), ivs: ivs31, level: 50 },
      { species: 'Incineroar', item: 'Sitrus Berry', ability: 'Intimidate', moves: ['Fake Out', 'Flare Blitz', 'Parting Shot', 'Throat Chop'], nature: 'Careful', evs: sp(32, 2, 0, 0, 32, 0), ivs: ivs31, level: 50 },
    ],
  },
  {
    id: 'pelipper-basculegion', name: 'Rain Swift Swim',
    description: 'Pelipper sets rain and Tailwind while Basculegion doubles speed with Swift Swim for Wave Crash + Last Respects cleanup.',
    tags: ['weather-rain', 'hyper-offense'], pokemon: ['Pelipper', 'Basculegion'],
    sets: [
      { species: 'Pelipper', item: 'Focus Sash', ability: 'Drizzle', moves: ['Weather Ball', 'Hurricane', 'Tailwind', 'Wide Guard'], nature: 'Modest', evs: sp(2, 0, 0, 32, 0, 32), ivs: ivs31, level: 50 },
      { species: 'Basculegion', item: 'Mystic Water', ability: 'Swift Swim', moves: ['Wave Crash', 'Last Respects', 'Aqua Jet', 'Protect'], nature: 'Adamant', evs: sp(2, 32, 0, 0, 0, 32), ivs: ivs31, level: 50 },
    ],
  },
];

/**
 * Tag definitions with display labels and descriptions.
 */
export const TEAM_TAGS: { id: string; label: string; color: string }[] = [
  { id: 'weather-sun', label: 'Sun', color: '#EE8130' },
  { id: 'weather-rain', label: 'Rain', color: '#6390F0' },
  { id: 'weather-sand', label: 'Sand', color: '#E2BF65' },
  { id: 'weather-snow', label: 'Snow', color: '#96D9D6' },
  { id: 'trick-room', label: 'Trick Room', color: '#F95587' },
  { id: 'tailwind', label: 'Tailwind', color: '#A98FF3' },
  { id: 'hyper-offense', label: 'Hyper Offense', color: '#C22E28' },
  { id: 'balanced', label: 'Balanced', color: '#7AC74C' },
  { id: 'mega-focused', label: 'Mega', color: '#6F35FC' },
  { id: 'bulky-offense', label: 'Bulky Offense', color: '#B7B7CE' },
  { id: 'semi-trick-room', label: 'Semi-TR', color: '#D685AD' },
  { id: 'terrain-electric', label: 'Elec Terrain', color: '#F7D02C' },
  { id: 'terrain-psychic', label: 'Psychic Terrain', color: '#F95587' },
  { id: 'terrain-grassy', label: 'Grassy Terrain', color: '#7AC74C' },
  { id: 'perish-trap', label: 'Perish Trap', color: '#735797' },
  { id: 'commander', label: 'Commander', color: '#2196F3' },
  { id: 'screens', label: 'Screens', color: '#4FC3F7' },
  { id: 'intimidate', label: 'Intimidate', color: '#FF7043' },
  { id: 'fake-out', label: 'Fake Out', color: '#26A69A' },
  { id: 'redirection', label: 'Redirection', color: '#AB47BC' },
];
