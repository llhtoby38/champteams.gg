import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  jsonb,
  uuid,
  timestamp,
  primaryKey,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ─── Pokemon Species ─────────────────────────────────────────────────────────

export const pokemon = pgTable('pokemon', {
  id: text('id').primaryKey(), // "garchomp"
  name: text('name').notNull(), // "Garchomp"
  dexNum: integer('dex_num').notNull(),
  types: text('types').array().notNull(), // ["Ground","Dragon"]
  baseStats: jsonb('base_stats').notNull(), // {hp,atk,def,spa,spd,spe}
  abilities: jsonb('abilities').notNull(), // {0:"Sand Veil", H:"Rough Skin"}
  heightm: real('heightm'),
  weightkg: real('weightkg'),
  tier: text('tier'), // doubles tier
  tags: text('tags').array(), // ["Restricted Legendary"]
  otherFormes: text('other_formes').array(),
  baseSpecies: text('base_species'), // null for base forms
  spriteId: text('sprite_id').notNull(), // for sprite URL generation
});

// ─── Moves ───────────────────────────────────────────────────────────────────

export const moves = pgTable('moves', {
  id: text('id').primaryKey(), // "earthquake"
  name: text('name').notNull(), // "Earthquake"
  type: text('type').notNull(), // "Ground"
  category: text('category').notNull(), // "Physical"|"Special"|"Status"
  basePower: integer('base_power').notNull(),
  accuracy: integer('accuracy'), // null = always hits
  pp: integer('pp').notNull(),
  priority: integer('priority').notNull().default(0),
  target: text('target').notNull(), // "allAdjacent", "normal", etc.
  flags: jsonb('flags').notNull(), // {contact:1, protect:1, ...}
  description: text('description'),
  secondary: jsonb('secondary'), // secondary effect data
});

// ─── Abilities ───────────────────────────────────────────────────────────────

export const abilities = pgTable('abilities', {
  id: text('id').primaryKey(), // "intimidate"
  name: text('name').notNull(), // "Intimidate"
  rating: integer('rating'), // 0-5
  description: text('description'),
});

// ─── Items ───────────────────────────────────────────────────────────────────

export const items = pgTable('items', {
  id: text('id').primaryKey(), // "choicescarf"
  name: text('name').notNull(), // "Choice Scarf"
  spriteNum: integer('sprite_num'),
  description: text('description'),
  isVgcRelevant: boolean('is_vgc_relevant').default(true),
});

// ─── Learnsets ───────────────────────────────────────────────────────────────

export const learnsets = pgTable(
  'learnsets',
  {
    pokemonId: text('pokemon_id')
      .notNull()
      .references(() => pokemon.id),
    moveId: text('move_id')
      .notNull()
      .references(() => moves.id),
    learnMethod: text('learn_method'), // "level-up", "tm", "egg", "tutor"
  },
  (table) => [primaryKey({ columns: [table.pokemonId, table.moveId] })],
);

// ─── Type Chart ──────────────────────────────────────────────────────────────

export const typeChart = pgTable(
  'type_chart',
  {
    attackingType: text('attacking_type').notNull(),
    defendingType: text('defending_type').notNull(),
    effectiveness: integer('effectiveness').notNull(), // 0=neutral,1=super,2=resist,3=immune
  },
  (table) => [
    primaryKey({ columns: [table.attackingType, table.defendingType] }),
  ],
);

// ─── Natures ─────────────────────────────────────────────────────────────────

export const natures = pgTable('natures', {
  id: text('id').primaryKey(), // "adamant"
  name: text('name').notNull(), // "Adamant"
  plus: text('plus'), // "atk" (null for neutral)
  minus: text('minus'), // "spa" (null for neutral)
});

// ─── Formats ─────────────────────────────────────────────────────────────────

export const formats = pgTable('formats', {
  id: text('id').primaryKey(), // "champions-reg-ma", "sv-reg-i", etc.
  name: text('name').notNull(), // "Champions Reg M-A"
  game: text('game').notNull(), // "champions", "scarlet-violet"
  description: text('description'),
  restrictedCount: integer('restricted_count').default(0), // 0, 1, or 2
  isActive: boolean('is_active').default(false),
  sortOrder: integer('sort_order').default(0), // for display ordering
});

// ─── Pokemon ↔ Format (junction) ────────────────────────────────────────────

export const pokemonFormats = pgTable(
  'pokemon_formats',
  {
    pokemonId: text('pokemon_id')
      .notNull()
      .references(() => pokemon.id),
    formatId: text('format_id')
      .notNull()
      .references(() => formats.id),
    isRestricted: boolean('is_restricted').default(false), // restricted legendary in this format
    isBanned: boolean('is_banned').default(false), // explicitly banned
  },
  (table) => [primaryKey({ columns: [table.pokemonId, table.formatId] })],
);

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique(), // used as username
  displayName: text('display_name'),
  passwordHash: text('password_hash'),
  googleId: text('google_id').unique(), // Google OAuth sub
  metaThreats: jsonb('meta_threats'), // User's custom meta threat list
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Teams ───────────────────────────────────────────────────────────────────

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  name: text('name').notNull().default('Untitled Team'),
  description: text('description'),
  format: text('format').default('season-m1'),
  pokemonSets: jsonb('pokemon_sets').notNull().default('[]'), // Array of PokemonSet
  metaThreats: jsonb('meta_threats'), // Custom meta threat list (null = use defaults)
  isPublic: boolean('is_public').default(false),
  source: text('source'), // URL link to team source (YouTube, X, etc.)
  author: text('author'), // Creator/author display name
  tags: text('tags').array().default([]), // Auto-generated strategy tags
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  // Composite index for the "my teams" query (filter by user, sort by recency).
  index('teams_user_updated_idx').on(table.userId, sql`${table.updatedAt} DESC`),
]);

// ─── Votes ───────────────────────────────────────────────────────────────────

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    value: integer('value').notNull(), // +1 or -1
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.teamId, table.userId)],
);

// ─── Template Votes (for static creator/core templates) ──────────────────────

export const templateVotes = pgTable(
  'template_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: text('template_id').notNull(), // matches TeamTemplate.id or PokemonCore.id
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    value: integer('value').notNull(), // +1 or -1
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.templateId, table.userId)],
);

// ─── Comments (threaded, Reddit-style) ───────────────────────────────────────

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  parentId: uuid('parent_id'), // null = top-level comment, set to comments.id for replies
  body: text('body').notNull(),
  score: integer('score').notNull().default(0), // denormalized vote total for fast sorting
  isDeleted: boolean('is_deleted').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const commentVotes = pgTable(
  'comment_votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    commentId: uuid('comment_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    value: integer('value').notNull(), // +1 or -1
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.commentId, table.userId)],
);

// ─── Saved Pokemon Sets ──────────────────────────────────────────────────────

export const savedSets = pgTable('saved_sets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  species: text('species').notNull(),
  setData: jsonb('set_data').notNull(),
  tags: text('tags').array(),
  source: text('source'), // "user", "ai-suggested", "meta-import"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Usage Stats (from Smogon) ──────────────────────────────────────────────

export const usageStats = pgTable(
  'usage_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pokemonId: text('pokemon_id').notNull(), // "incineroar"
    formatId: text('format_id').notNull(), // "gen9championsvgc2026regma" or "gen9vgc2026regi"
    month: text('month').notNull(), // "2026-03"
    usagePercent: real('usage_percent').notNull(), // 0-100
    rawCount: integer('raw_count').notNull(),
    moves: jsonb('moves').notNull(), // [{name, percent}] top 10
    items: jsonb('items').notNull(), // [{name, percent}] top 10
    abilities: jsonb('abilities').notNull(), // [{name, percent}] top 5
    spreads: jsonb('spreads').notNull(), // [{nature, evs, percent}] top 10
    teammates: jsonb('teammates').notNull(), // [{name, percent}] top 10
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.pokemonId, table.formatId, table.month)],
);

// ─── Default Sets (computed from tournament data) ──────────────────────────

export const defaultSets = pgTable('default_sets', {
  pokemonId: text('pokemon_id').primaryKey(),
  item: text('item').notNull().default(''),
  ability: text('ability').notNull().default(''),
  moves: text('moves').array().notNull().default([]),
  nature: text('nature').notNull().default('Adamant'),
  evs: jsonb('evs').notNull().default('{}'), // SP scale {hp:0,atk:0,def:0,spa:0,spd:0,spe:0}
  role: text('role'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Tier List Entries (per-Pokemon meta score) ─────────────────────────────

export const tierlistEntries = pgTable(
  'tierlist_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pokemonId: text('pokemon_id').notNull(),
    tier: text('tier').notNull(), // 'S' | 'A' | 'B' | 'C' | 'D'
    metaScore: real('meta_score').notNull(), // 0-100 composite score
    tournamentUsage: real('tournament_usage'), // raw % from Limitless
    winRate: real('win_rate'), // raw % from Limitless
    ladderUsage: real('ladder_usage'), // from Smogon usage_stats
    position: integer('position'), // order within tier
    momentum: integer('momentum').default(0), // community voting delta
    description: text('description'),
    previousTier: text('previous_tier'),
    movementNote: text('movement_note'),
    formatId: text('format_id').default('season-m1'),
    snapshotDate: text('snapshot_date').notNull(), // '2026-04-16'
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.pokemonId, table.formatId, table.snapshotDate)],
);

// ─── Tournament Entries (scraped from Limitless VGC) ────────────────────────

export const tournamentEntries = pgTable(
  'tournament_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tournamentId: text('tournament_id').notNull(),
    tournamentName: text('tournament_name').notNull(),
    tournamentDate: text('tournament_date').notNull(),
    playerName: text('player_name').notNull(),
    place: integer('place'),
    wins: integer('wins').notNull().default(0),
    losses: integer('losses').notNull().default(0),
    ties: integer('ties').notNull().default(0),
    pokemonList: text('pokemon_list').array().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.tournamentId, table.playerName)],
);

// ─── Pokemon Pair Stats (Suggested Partners) ────────────────────────────────
//
// Co-occurrence + win-rate stats per (primary, partner) pair. Pre-computed
// from tournament_entries because querying on demand would force a self-join
// on a 4k+ row table on every builder page load. Two rows per pair (A→B and
// B→A) so the "% of A teams with B" metric is direct without a swap.

export const pokemonPairStats = pgTable(
  'pokemon_pair_stats',
  {
    formatId: text('format_id').notNull(),
    primaryId: text('primary_id').notNull(),
    partnerId: text('partner_id').notNull(),
    primaryName: text('primary_name').notNull(),
    partnerName: text('partner_name').notNull(),
    coCount: integer('co_count').notNull(),
    primaryCount: integer('primary_count').notNull(),
    coOccurrencePct: real('co_occurrence_pct').notNull(),
    winRateTogether: real('win_rate_together'),
    smogonTeammatePct: real('smogon_teammate_pct'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.formatId, table.primaryId, table.partnerId] }),
    index('idx_pps_primary').on(table.formatId, table.primaryId),
  ],
);

// ─── Pipeline Metadata ──────────────────────────────────────────────────────

export const pipelineMetadata = pgTable('pipeline_metadata', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Notifications ──────────────────────────────────────────────────────────

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // 'comment' | 'reply' | 'like' | 'tier-list' | 'announcement' | 'follow-cta'
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  link: text('link'), // optional URL the notification points to (relative or absolute)
  // Optional refs that let the UI render richer cards without an extra fetch.
  actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
  actorName: text('actor_name'),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ─── Meta Cores (data-driven core pairs) ────────────────────────────────────

export const metaCores = pgTable(
  'meta_cores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pokemon1Id: text('pokemon1_id').notNull(), // alphabetically first
    pokemon2Id: text('pokemon2_id').notNull(),
    pokemon3Id: text('pokemon3_id'), // for trios
    pokemon4Id: text('pokemon4_id'), // for quads (future)
    coreScore: real('core_score').notNull(), // 0-100 composite
    synergyPercent: real('synergy_percent'), // from Smogon teammate %
    coOccurrence: real('co_occurrence'), // tournament co-occurrence %
    avgMetaScore: real('avg_meta_score'), // avg of both Pokemon's meta scores
    description: text('description'), // AI-generated synergy explanation
    tags: text('tags').array().default([]), // ['trick-room', 'weather-sun', ...]
    formatId: text('format_id').default('season-m1'),
    snapshotDate: text('snapshot_date').notNull(),
    voteScore: integer('vote_score').default(0),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [unique().on(table.pokemon1Id, table.pokemon2Id, table.pokemon3Id, table.formatId, table.snapshotDate)],
);
