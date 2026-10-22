ALTER TYPE "public"."document_kind" ADD VALUE 'drivers_license' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'diploma' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'photo_family_docs' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'medical_certificate' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'sor_declaration' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'medical_insurance' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE 'signed_contract' BEFORE 'other';--> statement-breakpoint
CREATE TABLE "reference_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"referee_name" text,
	"referee_position" text,
	"referee_company" text,
	"referee_address" text,
	"referee_phone" text,
	"employment_duration" text,
	"reason_for_leaving" text,
	"department" text,
	"positions_held" text,
	"one_word" text,
	"one_word_reason" text,
	"work_attitude" text,
	"would_rehire" boolean,
	"notes" text,
	"checked_by" uuid,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "registration_number" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "registration_seq" integer NOT NULL GENERATED ALWAYS AS IDENTITY (sequence name "candidates_registration_seq_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1);--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "community_of_interest" jsonb;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "general_practitioner" text;--> statement-breakpoint
ALTER TABLE "client_vacancy_requests" ADD COLUMN "reference_number" text;--> statement-breakpoint
ALTER TABLE "employment_contracts" ADD COLUMN "badge_expiry_date" text;--> statement-breakpoint
ALTER TABLE "employment_contracts" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "employment_contracts" ADD COLUMN "job_level" text;--> statement-breakpoint
ALTER TABLE "employment_contracts" ADD COLUMN "project_location" text;--> statement-breakpoint
ALTER TABLE "reference_checks" ADD CONSTRAINT "reference_checks_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_checks" ADD CONSTRAINT "reference_checks_checked_by_profiles_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reference_checks_application" ON "reference_checks" USING btree ("application_id");--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_registration_number_unique" UNIQUE("registration_number");