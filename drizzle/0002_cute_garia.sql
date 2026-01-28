DROP INDEX "products_identifier_idx";--> statement-breakpoint
DROP INDEX "products_role_idx";--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "role_id" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "products_software_identifier_idx" ON "products" USING btree ("software_id","identifier");