import type { StatsTable } from '@/types/pokemon';

// ─── Nature Table (all 25) ──────────────────────────────────────────────────

export interface NatureMod { plus: keyof StatsTable | null; minus: keyof StatsTable | null }

/** Full 25-nature lookup. Name keys match the canonical Showdown names. */
export const NATURE_MODS: Record<string, NatureMod> = {
  Adamant: { plus: 'atk', minus: 'spa' },
  Jolly:   { plus: 'spe', minus: 'spa' },
  Modest:  { plus: 'spa', minus: 'atk' },
  Timid:   { plus: 'spe', minus: 'atk' },
  Brave:   { plus: 'atk', minus: 'spe' },
  Quiet:   { plus: 'spa', minus: 'spe' },
  Bold:    { plus: 'def', minus: 'atk' },
  Impish:  { plus: 'def', minus: 'spa' },
  Calm:    { plus: 'spd', minus: 'atk' },
  Careful: { plus: 'spd', minus: 'spa' },
  Relaxed: { plus: 'def', minus: 'spe' },
  Sassy:   { plus: 'spd', minus: 'spe' },
  Naive:   { plus: 'spe', minus: 'spd' },
  Hasty:   { plus: 'spe', minus: 'def' },
  Lonely:  { plus: 'atk', minus: 'def' },
  Mild:    { plus: 'spa', minus: 'def' },
  Rash:    { plus: 'spa', minus: 'spd' },
  Gentle:  { plus: 'spd', minus: 'def' },
  Naughty: { plus: 'atk', minus: 'spd' },
  Lax:     { plus: 'def', minus: 'spd' },
  Serious: { plus: null, minus: null },
  Hardy:   { plus: null, minus: null },
  Docile:  { plus: null, minus: null },
  Bashful: { plus: null, minus: null },
  Quirky:  { plus: null, minus: null },
};

/** Look up a nature by name; returns neutral mods if unknown. */
export function getNatureMod(nature: string | null | undefined): NatureMod {
  return (nature && NATURE_MODS[nature]) || { plus: null, minus: null };
}

// ─── Champions Stat Point Constants ─────────────────────────────────────────

/** Maximum stat points per stat */
export const MAX_STAT_SP = 32;

/** Maximum total stat points across all stats */
export const MAX_TOTAL_SP = 66;

// Legacy aliases used by some components
export const MAX_STAT_EVS = MAX_STAT_SP;
export const MAX_TOTAL_EVS = MAX_TOTAL_SP;

/**
 * Calculate a single stat using the Champions formula.
 * From pokemon-showdown data/mods/champions/scripts.ts:
 *   HP  = BaseStat + SP + 75
 *   Atk = trunc(trunc((BaseStat + SP + 20) * natureMod) / 100) [integer math]
 *
 * This produces identical results to the standard formula with IV=31, EV=sp*8.
 */
export function calcStat(
  stat: keyof StatsTable,
  base: number,
  sp: number,
  nature: { plus: string | null; minus: string | null },
): number {
  if (stat === 'hp') {
    if (base === 1) return 1; // Shedinja
    return base + sp + 75;
  }

  let value = base + sp + 20;

  if (nature.plus === stat) {
    value = Math.trunc(Math.trunc(value * 110) / 100);
  } else if (nature.minus === stat) {
    value = Math.trunc(Math.trunc(value * 90) / 100);
  }

  return value;
}

/**
 * Calculate all stats using the Champions formula.
 */
export function calcAllStats(
  baseStats: StatsTable,
  sps: StatsTable,
  nature: { plus: string | null; minus: string | null },
): StatsTable {
  const stats: Partial<StatsTable> = {};
  for (const s of ['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as (keyof StatsTable)[]) {
    stats[s] = calcStat(s, baseStats[s], sps[s], nature);
  }
  return stats as StatsTable;
}

/**
 * Get total stat points used.
 */
export function totalEvs(sps: StatsTable): number {
  return sps.hp + sps.atk + sps.def + sps.spa + sps.spd + sps.spe;
}

/**
 * Convert old-style EVs (0-252, 510 total) to Champions SP (0-32, 66 total).
 * Detects whether values are already SP or need conversion.
 */
export function normalizeToSp(evs: StatsTable): StatsTable {
  const maxVal = Math.max(evs.hp, evs.atk, evs.def, evs.spa, evs.spd, evs.spe);
  const total = evs.hp + evs.atk + evs.def + evs.spa + evs.spd + evs.spe;

  // Already in SP format
  if (maxVal <= 32 && total <= 66) return evs;

  // Convert from old EVs
  const convert = (ev: number) => Math.min(Math.round(ev / 8), 32);
  const result: StatsTable = {
    hp: convert(evs.hp), atk: convert(evs.atk), def: convert(evs.def),
    spa: convert(evs.spa), spd: convert(evs.spd), spe: convert(evs.spe),
  };

  // Clamp total to 66
  let newTotal = result.hp + result.atk + result.def + result.spa + result.spd + result.spe;
  if (newTotal > MAX_TOTAL_SP) {
    const stats = (['hp', 'atk', 'def', 'spa', 'spd', 'spe'] as (keyof StatsTable)[])
      .filter(s => result[s] > 0)
      .sort((a, b) => result[a] - result[b]);
    let excess = newTotal - MAX_TOTAL_SP;
    for (const s of stats) {
      if (excess <= 0) break;
      const reduce = Math.min(result[s], excess);
      result[s] -= reduce;
      excess -= reduce;
    }
  }

  return result;
}

// Keep old name for backward compat during migration
export const normalizeEvsToSp = normalizeToSp;
