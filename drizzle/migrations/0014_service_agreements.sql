CREATE TYPE "public"."agreement_kind" AS ENUM('framework', 'secondment', 'recruitment', 'payroll', 'sla', 'nda', 'other');--> statement-breakpoint
CREATE TYPE "public"."agreement_status" AS ENUM('draft', 'active', 'cancelled');--> statement-breakpoint
CREATE TABLE "service_agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" text NOT NULL,
	"kind" "agreement_kind" DEFAULT 'framework' NOT NULL,
	"status" "agreement_status" DEFAULT 'draft' NOT NULL,
	"start_date" text,
	"end_date" text,
	"term_months" integer DEFAULT 12 NOT NULL,
	"auto_renew" boolean DEFAULT false NOT NULL,
	"notice_days" integer DEFAULT 30 NOT NULL,
	"value" numeric,
	"currency" text DEFAULT 'USD' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "service_agreements" ADD CONSTRAINT "service_agreements_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_agreements" ADD CONSTRAINT "service_agreements_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_service_agreements_client" ON "service_agreements" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_service_agreements_end" ON "service_agreements" USING btree ("end_date");