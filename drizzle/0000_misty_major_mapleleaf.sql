CREATE TABLE "abilities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"rating" integer,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sprite_num" integer,
	"description" text,
	"is_vgc_relevant" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "learnsets" (
	"pokemon_id" text NOT NULL,
	"move_id" text NOT NULL,
	"learn_method" text,
	CONSTRAINT "learnsets_pokemon_id_move_id_pk" PRIMARY KEY("pokemon_id","move_id")
);
--> statement-breakpoint
CREATE TABLE "moves" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"category" text NOT NULL,
	"base_power" integer NOT NULL,
	"accuracy" integer,
	"pp" integer NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"target" text NOT NULL,
	"flags" jsonb NOT NULL,
	"description" text,
	"secondary" jsonb
);
--> statement-breakpoint
CREATE TABLE "natures" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"plus" text,
	"minus" text
);
--> statement-breakpoint
CREATE TABLE "pokemon" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"dex_num" integer NOT NULL,
	"types" text[] NOT NULL,
	"base_stats" jsonb NOT NULL,
	"abilities" jsonb NOT NULL,
	"heightm" real,
	"weightkg" real,
	"tier" text,
	"tags" text[],
	"other_formes" text[],
	"base_species" text,
	"sprite_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"species" text NOT NULL,
	"set_data" jsonb NOT NULL,
	"tags" text[],
	"source" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" text DEFAULT 'Untitled Team' NOT NULL,
	"description" text,
	"format" text DEFAULT 'reg-m-a',
	"pokemon_sets" jsonb DEFAULT '[]' NOT NULL,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "type_chart" (
	"attacking_type" text NOT NULL,
	"defending_type" text NOT NULL,
	"effectiveness" integer NOT NULL,
	CONSTRAINT "type_chart_attacking_type_defending_type_pk" PRIMARY KEY("attacking_type","defending_type")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"display_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "learnsets" ADD CONSTRAINT "learnsets_pokemon_id_pokemon_id_fk" FOREIGN KEY ("pokemon_id") REFERENCES "public"."pokemon"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learnsets" ADD CONSTRAINT "learnsets_move_id_moves_id_fk" FOREIGN KEY ("move_id") REFERENCES "public"."moves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_sets" ADD CONSTRAINT "saved_sets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;