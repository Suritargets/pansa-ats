CREATE TYPE "public"."application_source" AS ENUM('online_form', 'digitized_paper');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('new', 'in_review', 'shortlisted', 'interview', 'offer', 'onboarding', 'active', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."company_kind" AS ENUM('parent', 'subsidiary');--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('cv', 'handwritten_scan', 'id_document', 'certificate', 'other');--> statement-breakpoint
CREATE TYPE "public"."onboarding_step_status" AS ENUM('pending', 'in_progress', 'done', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."payroll_export_status" AS ENUM('pending', 'exported', 'failed');--> statement-breakpoint
CREATE TYPE "public"."training_progress_status" AS ENUM('not_started', 'in_progress', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'hr_staff', 'recruiter', 'client');--> statement-breakpoint
CREATE TABLE "application_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"kind" "document_kind" DEFAULT 'other' NOT NULL,
	"storage_path" text NOT NULL,
	"file_name" text NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"changed_by" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"position_applied" text NOT NULL,
	"source" "application_source" DEFAULT 'online_form' NOT NULL,
	"status" "application_status" DEFAULT 'new' NOT NULL,
	"cover_note" text,
	"digitized_by" uuid,
	"digitized_at" timestamp with time zone,
	"assigned_recruiter" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_training_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"training_id" uuid NOT NULL,
	"status" "training_progress_status" DEFAULT 'not_started' NOT NULL,
	"score" numeric,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notes" text,
	CONSTRAINT "candidate_training_progress_application_id_training_id_unique" UNIQUE("application_id","training_id")
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text,
	"phone" text,
	"date_of_birth" text,
	"address" text,
	"id_number" text,
	"nationality" text,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"certifications" text[] DEFAULT '{}' NOT NULL,
	"years_experience" numeric,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_candidate_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"client_company_id" uuid NOT NULL,
	"shared_by" uuid,
	"shared_at" timestamp with time zone DEFAULT now() NOT NULL,
	"client_feedback" text,
	CONSTRAINT "client_candidate_shares_application_id_client_company_id_unique" UNIQUE("application_id","client_company_id")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" "company_kind" DEFAULT 'subsidiary' NOT NULL,
	"parent_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"step_template_id" uuid NOT NULL,
	"status" "onboarding_step_status" DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"notes" text,
	CONSTRAINT "onboarding_progress_application_id_step_template_id_unique" UNIQUE("application_id","step_template_id")
);
--> statement-breakpoint
CREATE TABLE "onboarding_step_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid,
	"step_order" integer NOT NULL,
	"title" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "payroll_export_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requested_by" uuid,
	"status" "payroll_export_status" DEFAULT 'pending' NOT NULL,
	"file_format" text DEFAULT 'csv' NOT NULL,
	"storage_path" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payroll_export_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"external_employee_id" text,
	"export_payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"role" "user_role" DEFAULT 'hr_staff' NOT NULL,
	"company_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"standard" text,
	"duration_hours" numeric,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_uploaded_by_profiles_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_profiles_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_digitized_by_profiles_id_fk" FOREIGN KEY ("digitized_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_assigned_recruiter_profiles_id_fk" FOREIGN KEY ("assigned_recruiter") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_training_progress" ADD CONSTRAINT "candidate_training_progress_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_training_progress" ADD CONSTRAINT "candidate_training_progress_training_id_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_candidate_shares" ADD CONSTRAINT "client_candidate_shares_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_candidate_shares" ADD CONSTRAINT "client_candidate_shares_client_company_id_companies_id_fk" FOREIGN KEY ("client_company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_candidate_shares" ADD CONSTRAINT "client_candidate_shares_shared_by_profiles_id_fk" FOREIGN KEY ("shared_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_step_template_id_onboarding_step_templates_id_fk" FOREIGN KEY ("step_template_id") REFERENCES "public"."onboarding_step_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_completed_by_profiles_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_step_templates" ADD CONSTRAINT "onboarding_step_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_export_batches" ADD CONSTRAINT "payroll_export_batches_requested_by_profiles_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_export_items" ADD CONSTRAINT "payroll_export_items_batch_id_payroll_export_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."payroll_export_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_export_items" ADD CONSTRAINT "payroll_export_items_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_applications_status" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_applications_company" ON "applications" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_applications_candidate" ON "applications" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "idx_candidates_name" ON "candidates" USING btree ("last_name","first_name");--> statement-breakpoint
CREATE INDEX "idx_candidates_email" ON "candidates" USING btree ("email");