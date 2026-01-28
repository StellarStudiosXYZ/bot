ALTER TABLE "product_sources" ALTER COLUMN "price" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_sources" ALTER COLUMN "currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "icon" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "banner" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "softwares" ALTER COLUMN "icon" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "softwares" ALTER COLUMN "emoji" SET NOT NULL;