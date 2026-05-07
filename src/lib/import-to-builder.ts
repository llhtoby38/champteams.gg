/**
 * Shared utilities for importing Pokemon/teams to the builder
 * and adding Pokemon to the meta threat list.
 */

import type { MetaThreat } from '@/types/calc';

/**
 * Mapping from mega species names to their base form + mega stone.
 * Used to convert mega Pokemon to base form when adding to the builder.
 */
const MEGA_TO_BASE: Record<string, { base: string; stone: string }> = {
  'Froslass-Mega': { base: 'Froslass', stone: 'Froslassite' },
  'Tyranitar-Mega': { base: 'Tyranitar', stone: 'Tyranitarite' },
  'Gengar-Mega': { base: 'Gengar', stone: 'Gengarite' },
  'Charizard-Mega-X': { base: 'Charizard', stone: 'Charizardite X' },
  'Charizard-Mega-Y': { base: 'Charizard', stone: 'Charizardite Y' },
  'Garchomp-Mega': { base: 'Garchomp', stone: 'Garchompite' },
  'Scizor-Mega': { base: 'Scizor', stone: 'Scizorite' },
  'Gardevoir-Mega': { base: 'Gardevoir', stone: 'Gardevoirite' },
  'Dragonite-Mega': { base: 'Dragonite', stone: 'Dragoninite' },
  'Starmie-Mega': { base: 'Starmie', stone: 'Starminite' },
  'Floette-Mega': { base: 'Floette-Eternal', stone: 'Floettite' },
  'Delphox-Mega': { base: 'Delphox', stone: 'Delphoxite' },
  'Glimmora-Mega': { base: 'Glimmora', stone: 'Glimmoranite' },
  'Venusaur-Mega': { base: 'Venusaur', stone: 'Venusaurite' },
  'Aggron-Mega': { base: 'Aggron', stone: 'Aggronite' },
  'Golurk-Mega': { base: 'Golurk', stone: 'Golurkite' },
  'Altaria-Mega': { base: 'Altaria', stone: 'Altarianite' },
  'Audino-Mega': { base: 'Audino', stone: 'Audinite' },
  'Gyarados-Mega': { base: 'Gyarados', stone: 'Gyaradosite' },
  'Kangaskhan-Mega': { base: 'Kangaskhan', stone: 'Kangaskhanite' },
  'Aerodactyl-Mega': { base: 'Aerodactyl', stone: 'Aerodactylite' },
  'Meganium-Mega': { base: 'Meganium', stone: 'Meganiumite' },
  'Ampharos-Mega': { base: 'Ampharos', stone: 'Ampharosite' },
};

/**
 * Import a team payload to the builder via localStorage.
 * Navigates to /builder after setting the import data.
 */
export function importToBuilder(payload: {
  name: string;
  pokemon: { species: string; item?: string; ability?: string; moves?: string[]; nature?: string; evs?: Record<string, number> }[];
}) {
  // Check for existing team to merge into
  let startSlot = 0;
  let mode: 'replace' | 'merge' = 'replace';
  try {
    const draft = localStorage.getItem('poketeam_draft_team');
    if (draft) {
      const parsed = JSON.parse(draft);
      const filledSlots = (parsed.slots || []).filter((s: any) => s?.species).length;
      if (filledSlots > 0 && filledSlots + payload.pokemon.length <= 6) {
        mode = 'merge';
        startSlot = filledSlots;
      }
    }
  } catch { /* ignore parse errors */ }

  // Convert any mega species to base form + mega stone in ALL imported Pokemon
  const convertedPokemon = payload.pokemon.map(p => {
    const megaInfo = MEGA_TO_BASE[p.species];
    if (megaInfo) {
      return { ...p, species: megaInfo.base, item: megaInfo.stone };
    }
    return p;
  });

  localStorage.setItem('poketeam_import_template', JSON.stringify({
    ...payload,
    pokemon: convertedPokemon,
    _mode: mode,
    _startSlot: startSlot,
  }));
  window.location.href = '/builder';
}

/**
 * A default set from the default_sets DB table.
 * `itemPool` is the ranked usage-stat items list used to resolve Item Clause
 * conflicts when multiple Pokemon in a core share their top item.
 */
export interface DefaultSet {
  item: string;
  itemPool?: { name: string; percent: number }[];
  ability: string;
  moves: string[];
  nature: string;
  evs: Record<string, number>;
  role: string | null;
}

/**
 * Pick a legal item for each Pokemon in a core, respecting Item Clause
 * (no duplicate items in a team). Mega stones are roster-unique so we
 * never dedupe them.
 */
export function resolveCoreItems(
  pokemon: { id?: string; name: string }[],
  defaultSets: Record<string, { item: string; itemPool?: { name: string; percent: number }[] }>,
): Record<string, string> {
  const setKey = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const out: Record<string, string> = {};
  const used = new Set<string>();
  for (const p of pokemon) {
    const key = setKey(p.name);
    const ds = defaultSets[key];
    if (!ds) continue;
    const pool = [ds.item, ...(ds.itemPool?.map(i => i.name) || [])].filter(Boolean);
    const primary = pool[0] || '';
    const isMegaStone = /ite( X| Y)?$/.test(primary);
    const pick = isMegaStone ? primary : pool.find(name => !used.has(name)) || primary;
    out[p.id || key] = pick;
    if (pick && !isMegaStone) used.add(pick);
  }
  return out;
}

/**
 * Build a PokemonSet from tier list usage data for importing to builder.
 * If a defaultSet is provided, its values take priority over usage data derivation.
 */
export function buildSetFromUsage(p: {
  name: string;
  items?: { name: string; percent: number }[] | null;
  usageAbilities?: { name: string; percent: number }[] | null;
  moves?: { name: string; percent: number }[] | null;
  spreads?: { nature: string; evs: string; percent: number }[] | null;
}, spreadIndex = 0, defaultSet?: DefaultSet | null) {
  // Convert mega species to base form + mega stone
  const megaInfo = MEGA_TO_BASE[p.name];
  const species = megaInfo ? megaInfo.base : p.name;
  const megaStone = megaInfo ? megaInfo.stone : null;

  if (defaultSet) {
    return {
      species,
      item: megaStone || defaultSet.item || p.items?.[0]?.name || '',
      ability: defaultSet.ability || p.usageAbilities?.[0]?.name || '',
      moves: defaultSet.moves.length > 0 ? defaultSet.moves.slice(0, 4) : (p.moves || []).slice(0, 4).map(m => m.name),
      nature: defaultSet.nature || 'Serious',
      evs: {
        hp: defaultSet.evs.hp ?? 0,
        atk: defaultSet.evs.atk ?? 0,
        def: defaultSet.evs.def ?? 0,
        spa: defaultSet.evs.spa ?? 0,
        spd: defaultSet.evs.spd ?? 0,
        spe: defaultSet.evs.spe ?? 0,
      },
      ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
      level: 50,
    };
  }

  const topSpread = p.spreads?.[spreadIndex];
  // Default SP = 0 for all stats (user can fill in)
  const defaultEvs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const evs = topSpread ? { ...defaultEvs, ...parseSpreadEvs(topSpread.evs) } : defaultEvs;

  return {
    species,
    item: megaStone || p.items?.[0]?.name || '',
    ability: p.usageAbilities?.[0]?.name || '',
    moves: (p.moves || []).slice(0, 4).map(m => m.name),
    nature: topSpread?.nature || 'Serious',
    evs: { hp: evs.hp || 0, atk: evs.atk || 0, def: evs.def || 0, spa: evs.spa || 0, spd: evs.spd || 0, spe: evs.spe || 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    level: 50,
  };
}

/**
 * Parse Smogon-style EV spread string to object.
 * e.g. "252 HP / 252 Atk / 4 Spe" → { hp: 252, atk: 252, spe: 4 }
 */
function parseSpreadEvs(evStr: string): Record<string, number> {
  const result: Record<string, number> = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  const statMap: Record<string, string> = {
    'HP': 'hp', 'Atk': 'atk', 'Def': 'def', 'SpA': 'spa', 'SpD': 'spd', 'Spe': 'spe',
    'hp': 'hp', 'atk': 'atk', 'def': 'def', 'spa': 'spa', 'spd': 'spd', 'spe': 'spe',
  };
  const parts = evStr.split('/').map(s => s.trim());
  for (const part of parts) {
    const match = part.match(/(\d+)\s+(\w+)/);
    if (match) {
      const val = parseInt(match[1]);
      const stat = statMap[match[2]];
      if (stat) result[stat] = val;
    }
  }
  return result;
}

/**
 * Convert traditional EVs (0-252) to SP scale (0-32) used by Champions.
 */
function evsToSp(evs: Record<string, number>): Partial<Record<string, number>> {
  const sp: Record<string, number> = {};
  for (const [stat, val] of Object.entries(evs)) {
    sp[stat] = Math.round((val / 252) * 32);
  }
  return sp;
}

/**
 * Add a Pokemon to the meta threat list.
 * Writes to localStorage and returns the updated list.
 */
export function addToMetaThreats(p: {
  name: string;
  id?: string;
  items?: { name: string; percent: number }[] | null;
  usageAbilities?: { name: string; percent: number }[] | null;
  moves?: { name: string; percent: number }[] | null;
  spreads?: { nature: string; evs: string; percent: number }[] | null;
}, spreadIndex = 0, defaultSet?: DefaultSet | null): MetaThreat[] {
  let threat: MetaThreat;

  if (defaultSet) {
    threat = {
      id: `custom-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`,
      species: p.name,
      item: defaultSet.item || p.items?.[0]?.name || '',
      ability: defaultSet.ability || p.usageAbilities?.[0]?.name || '',
      nature: defaultSet.nature || 'Adamant',
      evs: {
        hp: defaultSet.evs.hp ?? 0,
        atk: defaultSet.evs.atk ?? 0,
        def: defaultSet.evs.def ?? 0,
        spa: defaultSet.evs.spa ?? 0,
        spd: defaultSet.evs.spd ?? 0,
        spe: defaultSet.evs.spe ?? 0,
      },
      moves: defaultSet.moves.length > 0 ? defaultSet.moves.slice(0, 4) : (p.moves || []).slice(0, 4).map(m => m.name),
      role: defaultSet.role || 'Tournament meta',
    };
  } else {
    const topSpread = p.spreads?.[spreadIndex];
    const defaultSp = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
    const rawEvs = topSpread ? parseSpreadEvs(topSpread.evs) : {};
    const spEvs = Object.keys(rawEvs).length > 0 ? evsToSp(rawEvs) : defaultSp;

    threat = {
      id: `custom-${p.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`,
      species: p.name,
      item: p.items?.[0]?.name || '',
      ability: p.usageAbilities?.[0]?.name || '',
      nature: topSpread?.nature || 'Adamant',
      evs: spEvs,
      moves: (p.moves || []).slice(0, 4).map(m => m.name),
      role: 'Tournament meta',
    };
  }

  // Read existing threats
  let threats: MetaThreat[] = [];
  try {
    const stored = localStorage.getItem('poketeam_meta_threats');
    if (stored) threats = JSON.parse(stored);
  } catch { /* use empty */ }

  // Check for duplicate species — replace if exists
  const existingIdx = threats.findIndex(t => t.species.toLowerCase() === threat.species.toLowerCase());
  if (existingIdx >= 0) {
    threats[existingIdx] = threat;
  } else {
    threats.push(threat);
  }

  localStorage.setItem('poketeam_meta_threats', JSON.stringify(threats));
  return threats;
}
