CREATE TYPE "public"."client_status" AS ENUM('prospect', 'active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."contract_stage" AS ENUM('probation_2m', 'term_4m', 'extension_6m', 'extension_12m', 'permanent');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('draft', 'active', 'ended', 'terminated');--> statement-breakpoint
CREATE TYPE "public"."interview_type" AS ENUM('general', 'work_experience', 'client', 'medical', 'second_terms');--> statement-breakpoint
CREATE TYPE "public"."job_branche" AS ENUM('mining_operations', 'technical_maintenance', 'trades', 'hospitality_camp', 'administration_support', 'security_safety', 'logistics_warehouse');--> statement-breakpoint
CREATE TYPE "public"."job_level" AS ENUM('helper', 'operator', 'skilled', 'supervisor', 'administrative');--> statement-breakpoint
CREATE TYPE "public"."supplier_kind" AS ENUM('medical', 'staffing', 'insurance', 'training', 'government', 'other');--> statement-breakpoint
CREATE TYPE "public"."vacancy_request_status" AS ENUM('submitted', 'reviewing', 'approved', 'fulfilled', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'candidate';--> statement-breakpoint
CREATE TABLE "client_vacancy_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"job_category_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"status" "vacancy_request_status" DEFAULT 'submitted' NOT NULL,
	"requested_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"address" text,
	"status" "client_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emergency_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"name" text NOT NULL,
	"relationship" text,
	"phone" text,
	"address" text,
	"priority" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "employment_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"stage" "contract_stage" NOT NULL,
	"status" "contract_status" DEFAULT 'draft' NOT NULL,
	"start_date" text,
	"end_date" text,
	"hourly_wage" numeric,
	"badge_number" text,
	"bank_account" text,
	"bank_name" text,
	"probation_week4_notes" text,
	"probation_week8_notes" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"type" "interview_type" NOT NULL,
	"conducted_by" uuid,
	"conducted_at" timestamp with time zone,
	"questions" jsonb,
	"total_score" numeric,
	"average_score" numeric,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"branche" "job_branche" DEFAULT 'mining_operations' NOT NULL,
	"level" "job_level" DEFAULT 'operator' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" "supplier_kind" DEFAULT 'other' NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "client_candidate_shares" DROP CONSTRAINT "client_candidate_shares_application_id_client_company_id_unique";--> statement-breakpoint
ALTER TABLE "client_candidate_shares" DROP CONSTRAINT "client_candidate_shares_client_company_id_companies_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "job_category_id" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "client_id" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "candidate_id" uuid;--> statement-breakpoint
ALTER TABLE "client_vacancy_requests" ADD CONSTRAINT "client_vacancy_requests_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_vacancy_requests" ADD CONSTRAINT "client_vacancy_requests_job_category_id_job_categories_id_fk" FOREIGN KEY ("job_category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_vacancy_requests" ADD CONSTRAINT "client_vacancy_requests_requested_by_profiles_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emergency_contacts" ADD CONSTRAINT "emergency_contacts_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employment_contracts" ADD CONSTRAINT "employment_contracts_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_conducted_by_profiles_id_fk" FOREIGN KEY ("conducted_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_clients_name" ON "clients" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_emergency_contacts_candidate" ON "emergency_contacts" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "idx_contracts_application" ON "employment_contracts" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_interviews_application" ON "interviews" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "idx_suppliers_kind" ON "suppliers" USING btree ("kind");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_category_id_job_categories_id_fk" FOREIGN KEY ("job_category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_applications_client" ON "applications" USING btree ("client_id");--> statement-breakpoint
ALTER TABLE "client_candidate_shares" DROP COLUMN "client_company_id";