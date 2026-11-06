CREATE TYPE "public"."filter_term_kind" AS ENUM('blocked', 'phrase', 'sensitive');--> statement-breakpoint
CREATE TABLE "filter_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"term" text NOT NULL,
	"kind" "filter_term_kind" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "filter_terms_uniq" ON "filter_terms" USING btree ("term","kind");