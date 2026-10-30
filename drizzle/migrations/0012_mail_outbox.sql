CREATE TYPE "public"."mail_status" AS ENUM('pending', 'sending', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE "mail_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template" text NOT NULL,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"body_text" text DEFAULT '' NOT NULL,
	"body_html" text DEFAULT '' NOT NULL,
	"sensitive" boolean DEFAULT false NOT NULL,
	"status" "mail_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mail_outbox" ADD CONSTRAINT "mail_outbox_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mail_outbox_status" ON "mail_outbox" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "idx_mail_outbox_created" ON "mail_outbox" USING btree ("created_at");