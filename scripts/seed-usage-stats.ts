/**
 * Manually fetch and store Smogon usage statistics.
 *
 * Usage:
 *   npx tsx scripts/seed-usage-stats.ts                    # latest month, auto-detect format
 *   npx tsx scripts/seed-usage-stats.ts 2026-04            # specific month
 *   npx tsx scripts/seed-usage-stats.ts 2026-04 gen9championsvgc2026regma  # specific format
 *
 * In production, usage stats refresh automatically via lazy background fetch
 * (triggered by the /api/usage endpoint when data is >24h old).
 */

import { db, client } from './db';
import {
  findLatestMonth,
  fetchSmogonData,
  upsertStats,
} from '../src/lib/usage/smogon-fetcher';

const CHAMPIONS_FORMAT = 'gen9championsvgc2026regma';
const FALLBACK_FORMAT = 'gen9vgc2026regi';

async function seed() {
  const month = process.argv[2] || await findLatestMonth();
  let formatId = process.argv[3] || CHAMPIONS_FORMAT;

  console.log(`Seeding usage stats for month=${month}, format=${formatId}`);

  let data = await fetchSmogonData(month, formatId);
  if (!data && formatId === CHAMPIONS_FORMAT) {
    console.log(`Champions data not yet available, falling back to ${FALLBACK_FORMAT}`);
    formatId = FALLBACK_FORMAT;
    data = await fetchSmogonData(month, formatId);
  }

  if (!data) {
    console.error('No data available. Exiting.');
    await client.end();
    process.exit(1);
  }

  console.log(`Got data: ${data.info['number of battles']} battles, ${Object.keys(data.data).length} Pokemon`);

  const count = await upsertStats(db, data, formatId, month);
  console.log(`Seeded ${count} Pokemon usage stats for ${formatId} (${month})`);

  await client.end();
}

seed().catch(e => {
  console.error('Seed failed:', e);
  client.end();
  process.exit(1);
});
