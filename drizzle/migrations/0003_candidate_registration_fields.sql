CREATE TYPE "public"."gender" AS ENUM('man', 'vrouw');--> statement-breakpoint
CREATE TYPE "public"."marital_status" AS ENUM('gehuwd', 'ongehuwd', 'concubinaat', 'gescheiden');--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "birth_place" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "residence" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "district" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "origin_village" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "traditional_authority" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "marital_status" "marital_status";--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "gender" "gender";--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "religion" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "ethnic_group" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "has_justice_record" boolean;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "justice_record_reason" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "has_drivers_license" boolean;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "drivers_license_category" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "education" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "prior_trainings" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "work_history" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "worked_similar_company_before" boolean;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "worked_similar_company_details" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "last_job_description" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "last_supervisor_name" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "last_supervisor_contact" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "availability_date" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "bank_name" text;