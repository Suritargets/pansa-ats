CREATE TABLE "interview_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "interview_type" DEFAULT 'general' NOT NULL,
	"category" text,
	"text" text NOT NULL,
	"scored" boolean DEFAULT true NOT NULL,
	"step_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "related_to_staff_member" boolean;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "related_to_staff_member_details" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "personal_competencies" text;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "language_skills" text;--> statement-breakpoint
CREATE INDEX "idx_interview_questions_type" ON "interview_questions" USING btree ("type");