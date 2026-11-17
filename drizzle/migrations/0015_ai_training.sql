CREATE TABLE "ai_assistant_settings" (
	"assistant" text PRIMARY KEY NOT NULL,
	"instructions" text DEFAULT '' NOT NULL,
	"model" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assistant" text NOT NULL,
	"model" text NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"rating" integer,
	"note" text,
	"source" text DEFAULT 'test' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_examples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assistant" text NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_kb_entries" ADD COLUMN "audience" text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_chat_log" ADD CONSTRAINT "ai_chat_log_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_examples" ADD CONSTRAINT "ai_examples_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;