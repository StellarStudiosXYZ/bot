ALTER TYPE "public"."ticket_status" ADD VALUE 'CLOSING' BEFORE 'CLOSED';--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_software_id_softwares_id_fk";
--> statement-breakpoint
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_product_id_products_id_fk";
--> statement-breakpoint
ALTER TABLE "cases" ALTER COLUMN "action" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."case_action";--> statement-breakpoint
CREATE TYPE "public"."case_action" AS ENUM('WARN', 'TIMEOUT', 'KICK', 'BAN', 'UNBAN');--> statement-breakpoint
ALTER TABLE "cases" ALTER COLUMN "action" SET DATA TYPE "public"."case_action" USING "action"::"public"."case_action";--> statement-breakpoint
DROP INDEX "tickets_software_idx";--> statement-breakpoint
ALTER TABLE "tickets" ALTER COLUMN "id" SET DATA TYPE varchar(8);--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "software_id";--> statement-breakpoint
ALTER TABLE "tickets" DROP COLUMN "product_id";