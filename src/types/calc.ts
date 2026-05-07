import type { StatsTable } from './pokemon';

export interface CalcConditions {
  weather: '' | 'Sun' | 'Rain' | 'Sand' | 'Snow';
  terrain: '' | 'Electric' | 'Grassy' | 'Psychic' | 'Misty';
  isTrickRoom: boolean;
  // Attacker (your Pokemon) side
  attackerBoosts: Partial<StatsTable>;
  attackerStatus: '' | 'brn' | 'par' | 'frz' | 'slp' | 'psn' | 'tox';
  attackerSide: {
    isReflect: boolean;
    isLightScreen: boolean;
    isAuroraVeil: boolean;
    isHelpingHand: boolean;
    isTailwind: boolean;
    isBattery: boolean;
    isPowerSpot: boolean;
    isSteelySpirit: boolean;
  };
  // Defender (enemy) side
  defenderBoosts: Partial<StatsTable>;
  defenderStatus: '' | 'brn' | 'par' | 'frz' | 'slp' | 'psn' | 'tox';
  defenderSide: {
    isReflect: boolean;
    isLightScreen: boolean;
    isAuroraVeil: boolean;
    isHelpingHand: boolean;
    isFriendGuard: boolean;
    isTailwind: boolean;
  };
}

export const DEFAULT_CALC_CONDITIONS: CalcConditions = {
  weather: '',
  terrain: '',
  isTrickRoom: false,
  attackerBoosts: {},
  attackerStatus: '',
  attackerSide: {
    isReflect: false,
    isLightScreen: false,
    isAuroraVeil: false,
    isHelpingHand: false,
    isTailwind: false,
    isBattery: false,
    isPowerSpot: false,
    isSteelySpirit: false,
  },
  defenderBoosts: {},
  defenderStatus: '',
  defenderSide: {
    isReflect: false,
    isLightScreen: false,
    isAuroraVeil: false,
    isHelpingHand: false,
    isFriendGuard: false,
    isTailwind: false,
  },
};

export interface MetaThreat {
  id: string;
  species: string;
  item: string;
  nature: string;
  ability?: string;
  evs: Partial<StatsTable>;
  moves: string[];
  role?: string;
}


/**
 * Default meta threats for Pokemon Champions Reg M-A.
 *
 * Includes: common meta picks, weather team cores, TR setters/sweepers,
 * Intimidate users, Prankster support, and key offensive threats.
 *
 * HOW TO UPDATE:
 * 1. Research current usage data from Pikalytics/Champions Lab
 * 2. Add/modify entries in this array
 * 3. Each entry needs: species, item, nature, evs, moves, role
 * 4. The role field is displayed as a badge in the UI
 * 5. Changes take effect immediately on reload (stored in component state)
 * 6. Future: persist user customizations to localStorage or DB
 */
export const DEFAULT_META_THREATS: MetaThreat[] = [
  // Ordered by tournament usage (てるチャレDaily#1 4/8, Japan)
  // Items restricted to Pokemon Champions legal items (serebii.net/pokemonchampions/items.shtml)
  // 1. Incineroar — 67.6%
  { id: '1', species: 'Incineroar', item: 'Sitrus Berry', nature: 'Careful', ability: 'Intimidate',
    evs: { hp: 32, atk: 2, spd: 30, spe: 2 }, moves: ['Fake Out', 'Flare Blitz', 'Darkest Lariat', 'Parting Shot'], role: 'Intimidate pivot' },
  // 2. Sneasler — 32.4%
  { id: '2', species: 'Sneasler', item: 'White Herb', nature: 'Jolly', ability: 'Unburden',
    evs: { hp: 2, atk: 32, spe: 32 }, moves: ['Fake Out', 'Close Combat', 'Dire Claw', 'Protect'], role: 'Fake Out + Unburden' },
  // 3. Garchomp — 32.4%
  { id: '3', species: 'Garchomp', item: 'Choice Scarf', nature: 'Jolly', ability: 'Rough Skin',
    evs: { atk: 32, def: 2, spe: 32 }, moves: ['Earthquake', 'Dragon Claw', 'Rock Slide', 'Poison Jab'], role: 'Scarf sweeper' },
  // 4. Kingambit — 42.6%
  { id: '4', species: 'Kingambit', item: 'Black Glasses', nature: 'Adamant', ability: 'Defiant',
    evs: { hp: 32, atk: 32, def: 2 }, moves: ['Kowtow Cleave', 'Sucker Punch', 'Swords Dance', 'Protect'], role: 'Defiant attacker' },
  // 5. Sinistcha — 22.1%
  { id: '5', species: 'Sinistcha', item: 'Leftovers', nature: 'Calm', ability: 'Hospitality',
    evs: { hp: 26, def: 28, spa: 9, spd: 3 }, moves: ['Rage Powder', 'Matcha Gotcha', 'Strength Sap', 'Life Dew'], role: 'Redirection + recovery' },
  // 6. Charizard — 8.8% (Mega Y)
  { id: '6', species: 'Charizard', item: 'Charizardite Y', nature: 'Timid', ability: 'Blaze',
    evs: { hp: 2, spa: 32, spe: 32 }, moves: ['Heat Wave', 'Weather Ball', 'Tailwind', 'Protect'], role: 'Mega Y: Sun attacker' },
  // 7. Whimsicott — 10.3%
  { id: '7', species: 'Whimsicott', item: 'Focus Sash', nature: 'Timid', ability: 'Prankster',
    evs: { hp: 2, spa: 32, spe: 32 }, moves: ['Tailwind', 'Moonblast', 'Encore', 'Helping Hand'], role: 'Prankster Tailwind' },
  // 8. Basculegion — Swift Swim rain
  { id: '8', species: 'Basculegion', item: 'Mystic Water', nature: 'Adamant', ability: 'Swift Swim',
    evs: { atk: 32, def: 2, spe: 32 }, moves: ['Wave Crash', 'Last Respects', 'Aqua Jet', 'Phantom Force'], role: 'Rain sweeper (Swift Swim)' },
  // 9. Archaludon — Rain abuser
  { id: '9', species: 'Archaludon', item: 'Metal Coat', nature: 'Modest', ability: 'Stamina',
    evs: { hp: 32, spa: 32, spd: 2 }, moves: ['Flash Cannon', 'Electro Shot', 'Body Press', 'Dragon Pulse'], role: 'Rain abuser (Electro Shot)' },
  // 10. Pelipper — Drizzle
  { id: '10', species: 'Pelipper', item: 'Focus Sash', nature: 'Modest', ability: 'Drizzle',
    evs: { hp: 2, spa: 32, spe: 32 }, moves: ['Hurricane', 'Weather Ball', 'Tailwind', 'Protect'], role: 'Rain setter + Tailwind' },
  // 11. Rotom-Wash
  { id: '11', species: 'Rotom-Wash', item: 'Sitrus Berry', nature: 'Bold', ability: 'Levitate',
    evs: { hp: 32, def: 11, spa: 11, spd: 12 }, moves: ['Hydro Pump', 'Thunderbolt', 'Will-O-Wisp', 'Protect'], role: 'Bulky pivot + burn' },
  // 12. Gardevoir (Mega)
  { id: '12', species: 'Gardevoir', item: 'Gardevoirite', nature: 'Modest', ability: 'Telepathy',
    evs: { hp: 32, def: 14, spa: 15, spd: 1, spe: 4 }, moves: ['Hyper Voice', 'Psyshock', 'Trick Room', 'Protect'], role: 'Mega: Pixilate TR' },
  // 13. Maushold — Friend Guard
  { id: '13', species: 'Maushold', item: 'Lum Berry', nature: 'Jolly', ability: 'Friend Guard',
    evs: { hp: 32, def: 2, spe: 32 }, moves: ['Follow Me', 'Encore', 'Super Fang', 'Protect'], role: 'Friend Guard redirector' },
  // 14. Tyranitar — Sand
  { id: '14', species: 'Tyranitar', item: 'Chople Berry', nature: 'Adamant', ability: 'Sand Stream',
    evs: { hp: 32, atk: 32, spd: 2 }, moves: ['Rock Slide', 'Crunch', 'Low Kick', 'Ice Punch'], role: 'Sand setter + tank' },
  // 15. Excadrill — Sand Rush
  { id: '15', species: 'Excadrill', item: 'Focus Sash', nature: 'Jolly', ability: 'Sand Rush',
    evs: { atk: 32, def: 2, spe: 32 }, moves: ['High Horsepower', 'Iron Head', 'Rock Slide', 'Protect'], role: 'Sand Rush sweeper' },
  // 16. Froslass-Mega
  { id: '16', species: 'Froslass-Mega', item: 'Froslassite', nature: 'Timid', ability: 'Snow Warning',
    evs: { hp: 2, spa: 32, spe: 32 }, moves: ['Blizzard', 'Shadow Ball', 'Aurora Veil', 'Protect'], role: 'Mega: Snow + Aurora Veil' },
  // 17. Gengar-Mega
  { id: '17', species: 'Gengar-Mega', item: 'Gengarite', nature: 'Timid', ability: 'Shadow Tag',
    evs: { hp: 2, spa: 32, spe: 32 }, moves: ['Shadow Ball', 'Sludge Bomb', 'Disable', 'Protect'], role: 'Mega: Shadow Tag trapper' },
  // 18. Dragonite
  { id: '18', species: 'Dragonite', item: 'Lum Berry', nature: 'Adamant', ability: 'Multiscale',
    evs: { hp: 2, atk: 32, spe: 32 }, moves: ['Scale Shot', 'Extreme Speed', 'Haze', 'Protect'], role: 'Priority + Multiscale' },
  // 19. Arcanine-Hisui
  { id: '19', species: 'Arcanine-Hisui', item: 'Focus Sash', nature: 'Adamant', ability: 'Intimidate',
    evs: { hp: 13, atk: 32, spe: 21 }, moves: ['Flare Blitz', 'Rock Slide', 'Extreme Speed', 'Protect'], role: 'Rock/Fire Intimidate' },
  // 20. Floette-Mega (Eternal Floette)
  { id: '20', species: 'Floette-Mega', item: 'Floettite', nature: 'Bold', ability: 'Fairy Aura',
    evs: { hp: 32, def: 20, spa: 14 }, moves: ['Moonblast', 'Calm Mind', 'Draining Kiss', 'Light of Ruin'], role: 'Mega: Bulky special sweeper' },
  // 21. Hydreigon
  { id: '21', species: 'Hydreigon', item: 'Black Glasses', nature: 'Modest', ability: 'Levitate',
    evs: { hp: 2, spa: 32, spe: 32 }, moves: ['Dark Pulse', 'Draco Meteor', 'Flamethrower', 'Earth Power'], role: 'Special wallbreaker' },
  // 22. Primarina
  { id: '22', species: 'Primarina', item: 'Mystic Water', nature: 'Modest', ability: 'Liquid Voice',
    evs: { hp: 32, spa: 32, spd: 2 }, moves: ['Hyper Voice', 'Moonblast', 'Ice Beam', 'Protect'], role: 'Liquid Voice spread' },
  // 23. Farigiraf
  { id: '23', species: 'Farigiraf', item: 'Sitrus Berry', nature: 'Quiet', ability: 'Armor Tail',
    evs: { hp: 32, def: 23, spa: 2, spd: 9 }, moves: ['Hyper Voice', 'Trick Room', 'Imprison', 'Protect'], role: 'Armor Tail TR setter' },
  // 24. Kommo-o
  { id: '24', species: 'Kommo-o', item: 'Leftovers', nature: 'Bold', ability: 'Overcoat',
    evs: { hp: 26, def: 25, spa: 1, spd: 12, spe: 2 }, moves: ['Flamethrower', 'Iron Defense', 'Body Press', 'Protect'], role: 'Iron Def + Body Press' },
  // 25. Meganium-Mega (Mega Sol)
  { id: '25', species: 'Meganium-Mega', item: 'Meganiumite', nature: 'Modest', ability: 'Mega Sol',
    evs: { hp: 32, spa: 32, spd: 2 }, moves: ['Solar Beam', 'Earth Power', 'Synthesis', 'Protect'], role: 'Mega: Mega Sol sun' },
  // 26. Sylveon
  { id: '26', species: 'Sylveon', item: 'Fairy Feather', nature: 'Modest', ability: 'Pixilate',
    evs: { hp: 32, spa: 32, spd: 2 }, moves: ['Hyper Voice', 'Mystical Fire', 'Calm Mind', 'Protect'], role: 'Pixilate spread attacker' },
  // 27. Torkoal
  { id: '27', species: 'Torkoal', item: 'Charcoal', nature: 'Quiet', ability: 'Drought',
    evs: { hp: 32, spa: 32, spd: 2 }, moves: ['Eruption', 'Heat Wave', 'Earth Power', 'Protect'], role: 'Drought TR sweeper' },
  // 28. Palafin — Zero to Hero (First Tour 5th, 8th)
  { id: '28', species: 'Palafin', item: 'Mystic Water', nature: 'Adamant', ability: 'Zero to Hero',
    evs: { hp: 2, atk: 32, spe: 32 }, moves: ['Wave Crash', 'Jet Punch', 'Close Combat', 'Protect'], role: 'Zero to Hero attacker' },
  // 29. Clefable — Unaware redirector (First Tour 1st)
  { id: '29', species: 'Clefable', item: 'Sitrus Berry', nature: 'Bold', ability: 'Unaware',
    evs: { hp: 32, def: 32, spd: 2 }, moves: ['Follow Me', 'Helping Hand', 'Moonblast', 'Protect'], role: 'Unaware redirector' },
  // 30. Talonflame — Gale Wings Tailwind (First Tour 4th)
  { id: '30', species: 'Talonflame', item: 'Focus Sash', nature: 'Jolly', ability: 'Gale Wings',
    evs: { hp: 2, atk: 32, spe: 32 }, moves: ['Brave Bird', 'Flare Blitz', 'Tailwind', 'Protect'], role: 'Gale Wings Tailwind' },
  // 31. Kangaskhan-Mega — Parental Bond (First Tour 3rd, 15th)
  { id: '31', species: 'Kangaskhan-Mega', item: 'Kangaskhanite', nature: 'Adamant', ability: 'Parental Bond',
    evs: { hp: 2, atk: 32, spe: 32 }, moves: ['Fake Out', 'Double-Edge', 'Drain Punch', 'Sucker Punch'], role: 'Mega: Parental Bond' },
  // 32. Corviknight — Mirror Armor Tailwind (First Tour 17th)
  { id: '32', species: 'Corviknight', item: 'Occa Berry', nature: 'Careful', ability: 'Mirror Armor',
    evs: { hp: 32, def: 2, spd: 32 }, moves: ['Brave Bird', 'Iron Head', 'Bulk Up', 'Tailwind'], role: 'Mirror Armor Tailwind' },
  // 33. Politoed — Drizzle + Perish (First Tour 8th)
  { id: '33', species: 'Politoed', item: 'Leftovers', nature: 'Calm', ability: 'Drizzle',
    evs: { hp: 32, def: 2, spd: 32 }, moves: ['Weather Ball', 'Perish Song', 'Encore', 'Protect'], role: 'Drizzle + Perish' },
  // 34. Alolan Ninetales — Snow setter + Veil (First Tour 10th)
  { id: '34', species: 'Ninetales-Alola', item: 'Focus Sash', nature: 'Timid', ability: 'Snow Warning',
    evs: { hp: 2, spa: 32, spe: 32 }, moves: ['Blizzard', 'Icy Wind', 'Aurora Veil', 'Protect'], role: 'Snow setter + Veil' },
  // 35. Delphox-Mega — Mega Fire/Psychic (First Tour 1st)
  { id: '35', species: 'Delphox-Mega', item: 'Delphoxite', nature: 'Timid', ability: 'Levitate',
    evs: { hp: 2, spa: 32, spe: 32 }, moves: ['Heat Wave', 'Psychic', 'Substitute', 'Protect'], role: 'Mega: Fire/Psychic' },
  // 36. Basculegion — Scarf Adaptability (First Tour 1st, 3rd, 10th)
  { id: '36', species: 'Basculegion', item: 'Choice Scarf', nature: 'Adamant', ability: 'Adaptability',
    evs: { atk: 32, def: 2, spe: 32 }, moves: ['Wave Crash', 'Last Respects', 'Flip Turn', 'Aqua Jet'], role: 'Scarf Adaptability' },
];

