import { Dex } from '@pkmn/dex';
import { Generations } from '@pkmn/data';
import { eq } from 'drizzle-orm';
import { db, client } from './db';
import { moves } from '../src/lib/db/schema';

// Pokemon Champions ships with different values for some moves than Gen 9
// Scarlet/Violet (which is what @pkmn/dex hands us). Apply overrides after
// the standard seed so the DB reflects what players actually see in-game.
//
// Sources: Serebii Updated Attacks (serebii.net/pokemonchampions/updatedattacks.shtml),
// Game8 changes list, Bulbapedia. Secondary-effect tweaks (e.g., Iron Head
// flinch 30→20%) and flag/category changes (e.g., new Slicing classification)
// are not represented here — they live in JSONB columns and can be added
// later if/when needed.
type MoveOverride = {
  id: string;
  basePower?: number;
  accuracy?: number | null;
  pp?: number;
  type?: string;
  category?: 'Physical' | 'Special' | 'Status';
};

const championsMoveOverrides: MoveOverride[] = [
  { id: 'growth',         type: 'Grass' },
  { id: 'crabhammer',     accuracy: 95, pp: 12 },
  { id: 'bonerush',       basePower: 30, pp: 12 },
  { id: 'ironhead',       pp: 16 },
  { id: 'nightdaze',      basePower: 90, pp: 12 },
  { id: 'moonblast',      pp: 16 },
  { id: 'firstimpression', basePower: 100, pp: 12 },
  { id: 'spiritshackle',  basePower: 90, pp: 12 },
  { id: 'firelash',       basePower: 90, pp: 16 },
  { id: 'tropkick',       basePower: 85, pp: 16 },
  { id: 'beakblast',      basePower: 120, pp: 8 },
  { id: 'snaptrap',       type: 'Steel', pp: 16 },
  { id: 'appleacid',      basePower: 90, pp: 12 },
  { id: 'gravapple',      basePower: 90, pp: 12 },
  { id: 'direclaw',       pp: 16 },
  { id: 'psyshieldbash',  basePower: 90, pp: 12 },
  { id: 'mountaingale',   basePower: 120, pp: 12 },
  { id: 'infernalparade', basePower: 65, pp: 16 },
  { id: 'syrupbomb',      accuracy: 90, pp: 12 },
  { id: 'protect',        pp: 8 },
];

async function seedMoves() {
  console.log('Seeding moves...');

  const gens = new Generations(Dex);
  const gen = gens.get(9);

  const rows: (typeof moves.$inferInsert)[] = [];
  const seenIds = new Set<string>();

  // Include all gen9 standard moves
  for (const move of gen.moves) {
    if (move.isNonstandard) continue;

    rows.push({
      id: move.id,
      name: move.name,
      type: move.type,
      category: move.category,
      basePower: move.basePower,
      accuracy: move.accuracy === true ? null : move.accuracy,
      pp: move.pp,
      priority: move.priority,
      target: move.target,
      flags: { ...move.flags },
      description: move.shortDesc || move.desc || null,
      secondary: move.secondary ? { ...move.secondary } : null,
    });
    seenIds.add(move.id);
  }

  // Also include "Past" moves needed for Champions (e.g. King's Shield, Pursuit, Power-Up Punch)
  for (const move of Dex.moves.all()) {
    if (seenIds.has(move.id)) continue;
    if (move.isNonstandard !== 'Past') continue;

    rows.push({
      id: move.id,
      name: move.name,
      type: move.type,
      category: move.category,
      basePower: move.basePower,
      accuracy: move.accuracy === true ? null : move.accuracy,
      pp: move.pp,
      priority: move.priority,
      target: move.target,
      flags: { ...move.flags },
      description: (move as any).shortDesc || (move as any).desc || null,
      secondary: move.secondary ? { ...move.secondary } : null,
    });
    seenIds.add(move.id);
  }

  if (rows.length > 0) {
    await db.delete(moves);
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100);
      await db.insert(moves).values(chunk);
    }
  }

  console.log(`Seeded ${rows.length} moves`);

  // Champions-specific moves not in @pkmn/dex Gen 9 data
  const championsAdditions = [
    {
      id: 'lightofruin', name: 'Light of Ruin', type: 'Fairy', category: 'Special',
      basePower: 140, accuracy: 90, pp: 5, priority: 0, target: 'normal',
      flags: {}, description: 'Fires a beam using the Eternal Flower. The user also takes recoil damage equal to half the damage dealt.',
      secondary: null,
    },
    {
      id: 'burnup', name: 'Burn Up', type: 'Fire', category: 'Special',
      basePower: 130, accuracy: 100, pp: 5, priority: 0, target: 'normal',
      flags: { protect: 1, mirror: 1 },
      description: "User's Fire type becomes typeless; must be Fire.",
      secondary: null,
    },
  ];
  for (const move of championsAdditions) {
    await db.insert(moves).values(move).onConflictDoNothing();
  }
  console.log(`Added ${championsAdditions.length} Champions-specific moves`);

  // Apply Champions-specific overrides on top of the @pkmn/dex baseline.
  for (const override of championsMoveOverrides) {
    const { id, ...patch } = override;
    if (Object.keys(patch).length === 0) continue;
    await db.update(moves).set(patch).where(eq(moves.id, id));
  }
  console.log(`Applied ${championsMoveOverrides.length} Champions move overrides`);
}

export { seedMoves };

if (require.main === module) {
  seedMoves()
    .then(() => client.end())
    .catch((e) => {
      console.error(e);
      client.end();
      process.exit(1);
    });
}
