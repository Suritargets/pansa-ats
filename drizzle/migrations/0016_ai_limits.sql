CREATE TABLE "ai_global_settings" (
	"id" text PRIMARY KEY DEFAULT 'global' NOT NULL,
	"ocr_model" text,
	"temperature" numeric,
	"monthly_budget_usd" numeric,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feature" text NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage" USING btree ("created_at");