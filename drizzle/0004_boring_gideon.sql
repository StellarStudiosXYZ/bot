ALTER TABLE "cases" ALTER COLUMN "id" SET DATA TYPE varchar(8);--> statement-breakpoint
ALTER TABLE "cases" ALTER COLUMN "reason" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cases" ALTER COLUMN "duration" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "attachment" text;