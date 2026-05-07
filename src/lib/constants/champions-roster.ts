/**
 * Pokemon Champions Roster (~199 base species + regional forms + megas)
 *
 * Source: https://www.serebii.net/pokemonchampions/pokemon.shtml (updated 2026-04-08)
 * The roster is enforced via the pokemon_formats table (seed-formats.ts).
 * This file exists for reference and any client-side filtering.
 */
export const CHAMPIONS_ROSTER: string[] | null = null; // enforced via DB format filter

/**
 * Whether to use the Champions roster filter.
 * When false, all Gen 9 Pokemon are available in the team builder.
 */
export const USE_ROSTER_FILTER = false;

/**
 * Current VGC format identifier
 */
export const CURRENT_FORMAT = 'season-m1';

/**
 * The generation number for Pokemon Champions
 * Champions uses Gen 9 data as its base with Mega Evolution additions
 */
export const CHAMPIONS_GEN = 9;
