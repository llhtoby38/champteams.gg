import { calculate, Generations, Pokemon, Move, Field } from '@smogon/calc';
import type { StatsTable } from '@/types/pokemon';

const gen = Generations.get(9);

// Move stat overrides for moves where Pokemon Champions differs from the
// Gen 9 (Scarlet/Violet) data shipped by @smogon/calc. Keep in sync with
// `championsMoveOverrides` in scripts/seed-moves.ts so the calculator and
// the on-site move details agree.
//
// Only fields that affect damage calc are listed here (basePower, accuracy,
// type — type matters because of STAB). PP changes live only in the DB.
// Key by lowercased, alphanumeric move id (matches seed convention).
const championsMoveOverrides: Record<string, { basePower?: number; accuracy?: number; type?: string }> = {
  growth:         { type: 'Grass' },
  crabhammer:     { accuracy: 95 },
  bonerush:       { basePower: 30 },
  nightdaze:      { basePower: 90 },
  firstimpression: { basePower: 100 },
  spiritshackle:  { basePower: 90 },
  firelash:       { basePower: 90 },
  tropkick:       { basePower: 85 },
  beakblast:      { basePower: 120 },
  snaptrap:       { type: 'Steel' },
  appleacid:      { basePower: 90 },
  gravapple:      { basePower: 90 },
  psyshieldbash:  { basePower: 90 },
  mountaingale:   { basePower: 120 },
  infernalparade: { basePower: 65 },
  syrupbomb:      { accuracy: 90 },
};

function moveIdOf(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

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
    evs?: Partial<StatsTable>; // Stat points (0-32) in Champions
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
 * This survives Pokemon.clone() since EVs are part of the constructor.
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

function normalizeCalcSpecies(name: string): string {
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

  const moveOverride = championsMoveOverrides[moveIdOf(input.move)];
  const move = moveOverride
    ? new Move(gen, input.move, { overrides: moveOverride as Record<string, unknown> })
    : new Move(gen, input.move);

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
