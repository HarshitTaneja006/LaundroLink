CREATE TABLE IF NOT EXISTS "item_matches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lost_item_id" varchar NOT NULL,
	"found_item_id" varchar NOT NULL,
	"match_percentage" integer NOT NULL,
	"reasoning" text,
	"notified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now(),
	FOREIGN KEY ("lost_item_id") REFERENCES "lost_items"("id"),
	FOREIGN KEY ("found_item_id") REFERENCES "found_items"("id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "item_matches_lost_found_idx" on "item_matches" ("lost_item_id","found_item_id");
