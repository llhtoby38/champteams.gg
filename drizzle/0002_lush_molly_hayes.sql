CREATE TABLE "meta_cores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pokemon1_id" text NOT NULL,
	"pokemon2_id" text NOT NULL,
	"core_score" real NOT NULL,
	"synergy_percent" real,
	"co_occurrence" real,
	"avg_meta_score" real,
	"description" text,
	"tags" text[] DEFAULT '{}',
	"format_id" text DEFAULT 'season-m1',
	"snapshot_date" text NOT NULL,
	"vote_score" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "meta_cores_pokemon1_id_pokemon2_id_format_id_snapshot_date_unique" UNIQUE("pokemon1_id","pokemon2_id","format_id","snapshot_date")
);
--> statement-breakpoint
CREATE TABLE "tierlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pokemon_id" text NOT NULL,
	"tier" text NOT NULL,
	"meta_score" real NOT NULL,
	"tournament_usage" real,
	"win_rate" real,
	"ladder_usage" real,
	"position" integer,
	"momentum" integer DEFAULT 0,
	"format_id" text DEFAULT 'season-m1',
	"snapshot_date" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tierlist_entries_pokemon_id_format_id_snapshot_date_unique" UNIQUE("pokemon_id","format_id","snapshot_date")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "meta_threats" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");