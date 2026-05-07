/**
 * Smogon usage stats fetcher and parser.
 *
 * Fetches from https://www.smogon.com/stats/{month}/chaos/{format}-{rating}.json
 * Parses the chaos JSON into a normalized format for DB storage.
 *
 * Used by:
 * - scripts/seed-usage-stats.ts (manual seed)
 * - /api/usage route (lazy background refresh)
 */

import { usageStats } from '@/lib/db/schema';
import { sql, desc } from 'drizzle-orm';

const CHAMPIONS_FORMAT = 'gen9championsvgc2026regma';
const FALLBACK_FORMAT = 'gen9vgc2026regi';
const RATING = 1500;
const REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any; // drizzle db instance

export interface SmogonChaosData {
  info: { metagame: string; cutoff: number; 'number of battles': number };
  data: Record<string, {
    'Raw count': number;
    Abilities: Record<string, number>;
    Items: Record<string, number>;
    Moves: Record<string, number>;
    Spreads: Record<string, number>;
    Teammates: Record<string, number>;
  }>;
}

// ─── Name conversion ────────────────────────────────────────────────────────

const DISPLAY_NAMES: Record<string, string> = {
  'fakeout': 'Fake Out', 'knockoff': 'Knock Off', 'flareblitz': 'Flare Blitz',
  'partingshot': 'Parting Shot', 'uturn': 'U-turn', 'willowisp': 'Will-O-Wisp',
  'trickroom': 'Trick Room', 'heatwave': 'Heat Wave', 'closecombat': 'Close Combat',
  'suckerpunch': 'Sucker Punch', 'swordsdance': 'Swords Dance', 'icepunch': 'Ice Punch',
  'rockslide': 'Rock Slide', 'ironhead': 'Iron Head', 'dragonclaw': 'Dragon Claw',
  'shadowball': 'Shadow Ball', 'hypervoice': 'Hyper Voice', 'earthpower': 'Earth Power',
  'bodypress': 'Body Press', 'darkpulse': 'Dark Pulse', 'dracometeor': 'Draco Meteor',
  'icebeam': 'Ice Beam', 'thunderbolt': 'Thunderbolt', 'helpinghand': 'Helping Hand',
  'tailwind': 'Tailwind', 'protect': 'Protect', 'earthquake': 'Earthquake',
  'focussash': 'Focus Sash', 'safetygoggles': 'Safety Goggles', 'assaultvest': 'Assault Vest',
  'choicescarf': 'Choice Scarf', 'choicespecs': 'Choice Specs', 'choiceband': 'Choice Band',
  'lifeorb': 'Life Orb', 'sitrusberry': 'Sitrus Berry', 'leftovers': 'Leftovers',
  'rockyhelmet': 'Rocky Helmet', 'clearamulet': 'Clear Amulet', 'lumberry': 'Lum Berry',
  'mysticwater': 'Mystic Water', 'blackglasses': 'Black Glasses', 'expertbelt': 'Expert Belt',
  'lightclay': 'Light Clay', 'weaknesspolicy': 'Weakness Policy', 'covertcloak': 'Covert Cloak',
  'loadeddice': 'Loaded Dice', 'throatspray': 'Throat Spray', 'electricseed': 'Electric Seed',
  'ejectbutton': 'Eject Button', 'mirrorherb': 'Mirror Herb', 'muscleband': 'Muscle Band',
  'roomservice': 'Room Service', 'heavydutyboots': 'Heavy-Duty Boots',
  'mentalherb': 'Mental Herb', 'whiteherb': 'White Herb', 'powerherb': 'Power Herb',
  'ironball': 'Iron Ball', 'charcoal': 'Charcoal', 'metronome': 'Metronome',
  'chopleberry': 'Chople Berry', 'fairyfeather': 'Fairy Feather',
  'intimidate': 'Intimidate', 'levitate': 'Levitate', 'drizzle': 'Drizzle',
  'drought': 'Drought', 'swiftswim': 'Swift Swim', 'chlorophyll': 'Chlorophyll',
  'sandrush': 'Sand Rush', 'sandstream': 'Sand Stream', 'prankster': 'Prankster',
  'defiant': 'Defiant', 'clearbody': 'Clear Body', 'pixilate': 'Pixilate',
  'multiscale': 'Multiscale', 'roughskin': 'Rough Skin', 'unburden': 'Unburden',
  'hospitality': 'Hospitality', 'overcoat': 'Overcoat', 'competitive': 'Competitive',
  'magicbounce': 'Magic Bounce', 'friendguard': 'Friend Guard', 'unaware': 'Unaware',
  'galewings': 'Gale Wings', 'mirrorarmor': 'Mirror Armor', 'parentalbond': 'Parental Bond',
  'stamina': 'Stamina', 'liquidvoice': 'Liquid Voice', 'armortail': 'Armor Tail',
  'zerotohero': 'Zero to Hero', 'adaptability': 'Adaptability', 'shadowtag': 'Shadow Tag',
  'snowwarning': 'Snow Warning', 'toughclaws': 'Tough Claws',
};

function toDisplayName(id: string): string {
  if (DISPLAY_NAMES[id]) return DISPLAY_NAMES[id];
  return id.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, c => c.toUpperCase());
}

// ─── Parsing helpers ────────────────────────────────────────────────────────

function toPercent(entries: Record<string, number>, topN: number) {
  const total = Object.values(entries).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(entries)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([name, val]) => ({ name, percent: Math.round((val / total) * 1000) / 10 }))
    .filter(e => e.percent > 0);
}

function parseSpreads(entries: Record<string, number>, topN: number) {
  const total = Object.values(entries).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(entries)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([spread, val]) => {
      const [nature, evStr] = spread.split(':');
      const evArr = evStr.split('/').map(Number);
      return {
        nature,
        evs: { hp: evArr[0], atk: evArr[1], def: evArr[2], spa: evArr[3], spd: evArr[4], spe: evArr[5] },
        percent: Math.round((val / total) * 1000) / 10,
      };
    })
    .filter(e => e.percent > 0);
}

// ─── Fetching ───────────────────────────────────────────────────────────────

export async function findLatestMonth(): Promise<string> {
  const now = new Date();
  for (let i = 1; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    try {
      const res = await fetch(`https://www.smogon.com/stats/${month}/`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return month;
    } catch { /* try next */ }
  }
  return `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
}

export async function fetchSmogonData(month: string, formatId: string): Promise<SmogonChaosData | null> {
  const url = `https://www.smogon.com/stats/${month}/chaos/${formatId}-${RATING}.json`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    return await res.json() as SmogonChaosData;
  } catch {
    return null;
  }
}

// ─── DB upsert ──────────────────────────────────────────────────────────────

export async function upsertStats(database: AnyDb, data: SmogonChaosData, formatId: string, month: string): Promise<number> {
  const totalCount = Object.values(data.data).reduce((sum, p) => sum + p['Raw count'], 0) / 6;
  let count = 0;

  for (const [pokemon, pData] of Object.entries(data.data)) {
    const usagePercent = Math.round((pData['Raw count'] / totalCount) * 1000) / 10;
    if (usagePercent < 0.5) continue;

    const pokemonId = pokemon.toLowerCase().replace(/[^a-z0-9]/g, '');

    await database.insert(usageStats).values({
      pokemonId,
      formatId,
      month,
      usagePercent,
      rawCount: pData['Raw count'],
      moves: toPercent(pData.Moves, 12).map(m => ({ ...m, name: toDisplayName(m.name) })),
      items: toPercent(pData.Items, 10).map(i => ({ ...i, name: toDisplayName(i.name) })),
      abilities: toPercent(pData.Abilities, 5).map(a => ({ ...a, name: toDisplayName(a.name) })),
      spreads: parseSpreads(pData.Spreads, 10),
      teammates: toPercent(pData.Teammates, 10).map(t => ({ name: t.name, percent: t.percent })),
    }).onConflictDoUpdate({
      target: [usageStats.pokemonId, usageStats.formatId, usageStats.month],
      set: {
        usagePercent,
        rawCount: pData['Raw count'],
        moves: sql`excluded.moves`,
        items: sql`excluded.items`,
        abilities: sql`excluded.abilities`,
        spreads: sql`excluded.spreads`,
        teammates: sql`excluded.teammates`,
        updatedAt: sql`now()`,
      },
    });
    count++;
  }

  return count;
}

// ─── Lazy refresh logic (used by API route) ─────────────────────────────────

let refreshInProgress = false;
let lastRefreshCheck = 0;

/**
 * Check if usage data needs refreshing and trigger a background refresh.
 * Returns immediately — never blocks the caller.
 *
 * To avoid OOM on 512MB Render instances, this only refreshes if the
 * table is completely empty (first-time seed). For ongoing monthly updates,
 * use the manual seed script instead: npx tsx scripts/seed-usage-stats.ts
 */
export async function maybeRefreshUsageStats(database: AnyDb): Promise<void> {
  const now = Date.now();

  // Don't check more than once per 6 hours
  if (now - lastRefreshCheck < 6 * 60 * 60 * 1000) return;
  lastRefreshCheck = now;

  if (refreshInProgress) return;

  // Only auto-refresh if the table is empty (initial seed)
  // Monthly updates should be done via the seed script to avoid OOM
  const count = await database.select({ count: sql<number>`count(*)` })
    .from(usageStats);
  const rowCount = Number(count[0]?.count ?? 0);

  if (rowCount > 0) return; // Data exists, skip auto-refresh

  // Table is empty — do initial seed
  refreshInProgress = true;
  console.log('[usage-stats] Table empty, triggering initial seed...');
  refreshUsageStats(database)
    .catch(e => console.error('[usage-stats] Background refresh failed:', e))
    .finally(() => { refreshInProgress = false; });
}

async function refreshUsageStats(database: AnyDb): Promise<void> {
  // Guard against OOM on small instances
  const mem = process.memoryUsage();
  if (mem.rss > 400 * 1024 * 1024) { // >400MB RSS = too risky on 512MB
    console.log(`[usage-stats] Skipping refresh — RSS ${Math.round(mem.rss / 1024 / 1024)}MB too high`);
    return;
  }
  console.log('[usage-stats] Starting background refresh...');

  const month = await findLatestMonth();

  let data = await fetchSmogonData(month, CHAMPIONS_FORMAT);
  let formatId = CHAMPIONS_FORMAT;
  if (!data) {
    formatId = FALLBACK_FORMAT;
    data = await fetchSmogonData(month, formatId);
  }

  if (!data) {
    console.log('[usage-stats] No data available from Smogon');
    return;
  }

  const count = await upsertStats(database, data, formatId, month);
  console.log(`[usage-stats] Refreshed: ${count} Pokemon for ${formatId} (${month})`);
}
