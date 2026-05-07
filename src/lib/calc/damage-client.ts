/**
 * Client-side damage calculator using @smogon/calc.
 * Runs entirely in the browser — no API calls needed.
 * Uses the Champions stat formula by converting SP to EVs (sp*8, 32→252).
 */

import { calculate, Generations, Pokemon, Move, Field } from '@smogon/calc';
import type { StatsTable } from '@/types/pokemon';

const gen = Generations.get(9);

export interface SideConditions {
  isReflect?: boolean;
  isLightScreen?: boolean;
  isAuroraVeil?: boolean;
  isHelpingHand?: boolean;
  isFriendGuard?: boolean;
  isTailwind?: boolean;
  isBattery?: boolean;
  isPowerSpot?: boolean;
  isSteelySpirit?: boolean;
}

export interface DamageCalcInput {
  attacker: {
    species: string;
    item?: string;
    ability?: string;
    nature?: string;
    evs?: Partial<StatsTable>;
    boosts?: Partial<StatsTable>;
    status?: string;
    level?: number;
  };
  defender: {
    species: string;
    item?: string;
    ability?: string;
    nature?: string;
    evs?: Partial<StatsTable>;
    boosts?: Partial<StatsTable>;
    status?: string;
    level?: number;
  };
  move: string;
  field?: {
    gameType?: 'Singles' | 'Doubles';
    weather?: string;
    terrain?: string;
    attackerSide?: SideConditions;
    defenderSide?: SideConditions;
    isHelpingHand?: boolean;
    isFriendGuard?: boolean;
  };
}

export interface DamageCalcResult {
  minDamage: number;
  maxDamage: number;
  minPercent: number;
  maxPercent: number;
  koChance: string;
  description: string;
  defenderHp: number;
}

/**
 * Convert Champions stat points (0-32) to EVs for @smogon/calc.
 * The standard formula with IV=31 and EV=sp*8 (or 252 for sp=32)
 * produces identical stats to the Champions formula.
 */
function spToEvs(sps: Partial<StatsTable>): Record<string, number> {
  const convert = (sp: number) => sp >= 32 ? 252 : sp * 8;
  return {
    hp: convert(sps.hp ?? 0),
    atk: convert(sps.atk ?? 0),
    def: convert(sps.def ?? 0),
    spa: convert(sps.spa ?? 0),
    spd: convert(sps.spd ?? 0),
    spe: convert(sps.spe ?? 0),
  };
}

/**
 * Normalize species names for @smogon/calc compatibility.
 * Some names in our DB don't match what the calc library expects.
 */
function normalizeCalcSpecies(name: string): string {
  // @smogon/calc Gen 9 doesn't have "Aegislash" — only "Aegislash-Shield" and "Aegislash-Blade"
  if (name === 'Aegislash') return 'Aegislash-Shield';
  return name;
}

export function calculateDamage(input: DamageCalcInput): DamageCalcResult {
  const attacker = new Pokemon(gen, normalizeCalcSpecies(input.attacker.species), {
    level: input.attacker.level || 50,
    item: input.attacker.item,
    ability: input.attacker.ability,
    nature: input.attacker.nature,
    evs: spToEvs(input.attacker.evs || {}),
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    boosts: input.attacker.boosts as unknown as Record<string, number>,
    status: (input.attacker.status || '') as '',
  });

  const defender = new Pokemon(gen, normalizeCalcSpecies(input.defender.species), {
    level: input.defender.level || 50,
    item: input.defender.item,
    ability: input.defender.ability,
    nature: input.defender.nature,
    evs: spToEvs(input.defender.evs || {}),
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    boosts: input.defender.boosts as unknown as Record<string, number>,
    status: (input.defender.status || '') as '',
  });

  const move = new Move(gen, input.move);

  const atkSide = input.field?.attackerSide || {};
  const defSide = input.field?.defenderSide || {};

  const field = new Field({
    gameType: input.field?.gameType || 'Doubles',
    weather: input.field?.weather as 'Sun' | 'Rain' | 'Sand' | 'Snow' | undefined,
    terrain: input.field?.terrain as 'Electric' | 'Grassy' | 'Psychic' | 'Misty' | undefined,
    attackerSide: {
      isReflect: atkSide.isReflect,
      isLightScreen: atkSide.isLightScreen,
      isAuroraVeil: atkSide.isAuroraVeil,
      isHelpingHand: atkSide.isHelpingHand || input.field?.isHelpingHand,
      isFriendGuard: atkSide.isFriendGuard,
      isTailwind: atkSide.isTailwind,
      isBattery: atkSide.isBattery,
      isPowerSpot: atkSide.isPowerSpot,
      isSteelySpirit: atkSide.isSteelySpirit,
    },
    defenderSide: {
      isReflect: defSide.isReflect,
      isLightScreen: defSide.isLightScreen,
      isAuroraVeil: defSide.isAuroraVeil,
      isHelpingHand: defSide.isHelpingHand,
      isFriendGuard: defSide.isFriendGuard || input.field?.isFriendGuard,
      isTailwind: defSide.isTailwind,
      isBattery: defSide.isBattery,
      isPowerSpot: defSide.isPowerSpot,
      isSteelySpirit: defSide.isSteelySpirit,
    },
  });

  const result = calculate(gen, attacker, defender, move, field);
  const range = result.range();
  const defenderHp = defender.maxHP();

  return {
    minDamage: range[0],
    maxDamage: range[1],
    minPercent: Math.round((range[0] / defenderHp) * 1000) / 10,
    maxPercent: Math.round((range[1] / defenderHp) * 1000) / 10,
    koChance: (result as unknown as { kochance?: () => { text: string } }).kochance?.()?.text || result.desc(),
    description: result.desc(),
    defenderHp,
  };
}

/**
 * Calculate damage for multiple moves against a single defender.
 */
export function calculateBulkDamage(
  attacker: DamageCalcInput['attacker'],
  defender: DamageCalcInput['defender'],
  moves: string[],
  fieldOptions?: DamageCalcInput['field'],
): (DamageCalcResult & { move: string })[] {
  return moves
    .filter(Boolean)
    .map((move) => {
      try {
        const result = calculateDamage({ attacker, defender, move, field: fieldOptions });
        return { ...result, move };
      } catch {
        return null;
      }
    })
    .filter((r): r is DamageCalcResult & { move: string } => r !== null);
}
