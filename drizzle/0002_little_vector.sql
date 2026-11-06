CREATE TABLE "collectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"scene" text,
	"website" text,
	"instagram" text,
	"status" "status" DEFAULT 'published' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collectives_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"message" text NOT NULL,
	"handled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_collectives" (
	"event_id" uuid NOT NULL,
	"collective_id" uuid NOT NULL,
	CONSTRAINT "event_collectives_event_id_collective_id_pk" PRIMARY KEY("event_id","collective_id")
);
--> statement-breakpoint
ALTER TABLE "venues" ADD COLUMN "listed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "collectives" ADD CONSTRAINT "collectives_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_collectives" ADD CONSTRAINT "event_collectives_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_collectives" ADD CONSTRAINT "event_collectives_collective_id_collectives_id_fk" FOREIGN KEY ("collective_id") REFERENCES "public"."collectives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ec_collective_idx" ON "event_collectives" USING btree ("collective_id");