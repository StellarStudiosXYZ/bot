CREATE TYPE "public"."case_action" AS ENUM('WARN', 'TIMEOUT', 'KICK', 'BAN', 'UNBAN', 'LOCK', 'UNLOCK');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('USD', 'EUR');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('SOURCEXCHANGE', 'BUILTBYBIT', 'GITHUB');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('OPEN', 'CLOSED');--> statement-breakpoint
CREATE TABLE "cases" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"action" "case_action" NOT NULL,
	"target_user_id" varchar(32) NOT NULL,
	"moderator_user_id" varchar(32) NOT NULL,
	"reason" text,
	"duration" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_changelogs" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"product_id" varchar(36) NOT NULL,
	"version" varchar(32) NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_licenses" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"discord_user_id" varchar(32) NOT NULL,
	"product_id" varchar(36) NOT NULL,
	"product_source_id" varchar(36) NOT NULL,
	"payment_id" varchar(128) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_sources" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"product_id" varchar(36) NOT NULL,
	"source" "source" NOT NULL,
	"price" numeric(10, 2),
	"currency" "currency",
	"link" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"software_id" varchar(36) NOT NULL,
	"identifier" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"version" varchar(32) NOT NULL,
	"summary" text NOT NULL,
	"icon" text,
	"banner" text,
	"emoji" text,
	"role_id" varchar(32) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "softwares" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"identifier" varchar(64) NOT NULL,
	"name" varchar(128) NOT NULL,
	"icon" text,
	"emoji" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"discord_user_id" varchar(32) NOT NULL,
	"channel_id" varchar(32) NOT NULL,
	"category" varchar(32) NOT NULL,
	"software_id" varchar(36),
	"product_id" varchar(36),
	"status" "ticket_status" DEFAULT 'OPEN' NOT NULL,
	"transcript_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "product_changelogs" ADD CONSTRAINT "product_changelogs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_licenses" ADD CONSTRAINT "product_licenses_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_licenses" ADD CONSTRAINT "product_licenses_product_source_id_product_sources_id_fk" FOREIGN KEY ("product_source_id") REFERENCES "public"."product_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sources" ADD CONSTRAINT "product_sources_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_software_id_softwares_id_fk" FOREIGN KEY ("software_id") REFERENCES "public"."softwares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_software_id_softwares_id_fk" FOREIGN KEY ("software_id") REFERENCES "public"."softwares"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cases_target_user_idx" ON "cases" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "cases_moderator_user_idx" ON "cases" USING btree ("moderator_user_id");--> statement-breakpoint
CREATE INDEX "cases_action_idx" ON "cases" USING btree ("action");--> statement-breakpoint
CREATE UNIQUE INDEX "product_changelogs_product_version_idx" ON "product_changelogs" USING btree ("product_id","version");--> statement-breakpoint
CREATE INDEX "product_changelogs_product_idx" ON "product_changelogs" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_licenses_payment_idx" ON "product_licenses" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_licenses_user_product_source_idx" ON "product_licenses" USING btree ("discord_user_id","product_id","product_source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_sources_product_source_idx" ON "product_sources" USING btree ("product_id","source");--> statement-breakpoint
CREATE UNIQUE INDEX "products_identifier_idx" ON "products" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "products_role_idx" ON "products" USING btree ("role_id");--> statement-breakpoint
CREATE INDEX "products_software_idx" ON "products" USING btree ("software_id");--> statement-breakpoint
CREATE UNIQUE INDEX "softwares_identifier_idx" ON "softwares" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "softwares_name_idx" ON "softwares" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_channel_idx" ON "tickets" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "tickets_discord_user_idx" ON "tickets" USING btree ("discord_user_id");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tickets_software_idx" ON "tickets" USING btree ("software_id");