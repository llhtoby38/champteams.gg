export interface StatsTable {
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
}

export interface PokemonSet {
  species: string;
  item: string;
  ability: string;
  moves: [string, string, string, string];
  nature: string;
  evs: StatsTable;
  ivs: StatsTable;
  level: number;
  gender?: string;
  nickname?: string;
  shiny?: boolean;
  teraType?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  format: string;
  pokemon: (PokemonSet | null)[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PokemonSpecies {
  id: string;
  name: string;
  dexNum: number;
  types: string[];
  baseStats: StatsTable;
  abilities: Record<string, string>;
  heightm: number | null;
  weightkg: number | null;
  tier: string | null;
  tags: string[] | null;
  otherFormes: string[] | null;
  baseSpecies: string | null;
  spriteId: string;
}

export interface Move {
  id: string;
  name: string;
  type: string;
  category: 'Physical' | 'Special' | 'Status';
  basePower: number;
  accuracy: number | null;
  pp: number;
  priority: number;
  target: string;
  flags: Record<string, number>;
  description: string | null;
  secondary: Record<string, unknown> | null;
}

export interface Item {
  id: string;
  name: string;
  spriteNum: number | null;
  description: string | null;
  isVgcRelevant: boolean;
}

export interface Nature {
  id: string;
  name: string;
  plus: string | null;
  minus: string | null;
}

export const DEFAULT_EVS: StatsTable = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
export const DEFAULT_IVS: StatsTable = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

export function createEmptySet(species: string, ability: string): PokemonSet {
  return {
    species,
    item: '',
    ability,
    moves: ['', '', '', ''],
    nature: 'Serious',
    evs: { ...DEFAULT_EVS },
    ivs: { ...DEFAULT_IVS },
    level: 50,
  };
}

export const STAT_NAMES: Record<keyof StatsTable, string> = {
  hp: 'HP',
  atk: 'Attack',
  def: 'Defense',
  spa: 'Sp. Atk',
  spd: 'Sp. Def',
  spe: 'Speed',
};
