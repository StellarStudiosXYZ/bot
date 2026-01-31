CREATE TYPE "public"."case_action" AS ENUM('WARN', 'TIMEOUT', 'KICK', 'BAN', 'UNBAN');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('USD', 'EUR');--> statement-breakpoint
CREATE TYPE "public"."source" AS ENUM('SOURCEXCHANGE', 'BUILTBYBIT', 'GITHUB');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('OPEN', 'CLOSING', 'CLOSED');--> statement-breakpoint
CREATE TABLE "cases" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"action" "case_action" NOT NULL,
	"target_user_id" varchar NOT NULL,
	"moderator_user_id" varchar NOT NULL,
	"reason" text NOT NULL,
	"attachment" text,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_changelogs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_changelogs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"version" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_licenses" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_licenses_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"discord_user_id" varchar NOT NULL,
	"product_id" integer NOT NULL,
	"source" "source" NOT NULL,
	"source_product_id" varchar NOT NULL,
	"payment_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_sources" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "product_sources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"product_id" integer NOT NULL,
	"source" "source" NOT NULL,
	"source_product_id" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"link" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "products_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"software_id" integer NOT NULL,
	"identifier" varchar NOT NULL,
	"name" varchar NOT NULL,
	"version" varchar NOT NULL,
	"summary" text NOT NULL,
	"icon" text NOT NULL,
	"banner" text NOT NULL,
	"emoji" text,
	"role_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "softwares" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "softwares_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"identifier" varchar NOT NULL,
	"name" varchar NOT NULL,
	"icon" text NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"discord_user_id" varchar NOT NULL,
	"channel_id" varchar NOT NULL,
	"category" varchar NOT NULL,
	"status" "ticket_status" DEFAULT 'OPEN' NOT NULL,
	"transcript_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "product_changelogs" ADD CONSTRAINT "product_changelogs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_licenses" ADD CONSTRAINT "product_licenses_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_sources" ADD CONSTRAINT "product_sources_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_software_id_softwares_id_fk" FOREIGN KEY ("software_id") REFERENCES "public"."softwares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cases_target_user_idx" ON "cases" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "cases_moderator_user_idx" ON "cases" USING btree ("moderator_user_id");--> statement-breakpoint
CREATE INDEX "cases_action_idx" ON "cases" USING btree ("action");--> statement-breakpoint
CREATE UNIQUE INDEX "product_changelogs_product_version_idx" ON "product_changelogs" USING btree ("product_id","version");--> statement-breakpoint
CREATE INDEX "product_changelogs_product_idx" ON "product_changelogs" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_licenses_payment_idx" ON "product_licenses" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_licenses_user_source_product_idx" ON "product_licenses" USING btree ("discord_user_id","source","source_product_id");--> statement-breakpoint
CREATE INDEX "product_licenses_product_idx" ON "product_licenses" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_licenses_source_idx" ON "product_licenses" USING btree ("source");--> statement-breakpoint
CREATE UNIQUE INDEX "product_sources_source_pid_idx" ON "product_sources" USING btree ("source","source_product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_sources_product_source_idx" ON "product_sources" USING btree ("product_id","source");--> statement-breakpoint
CREATE INDEX "product_sources_product_idx" ON "product_sources" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_software_identifier_idx" ON "products" USING btree ("software_id","identifier");--> statement-breakpoint
CREATE INDEX "products_software_idx" ON "products" USING btree ("software_id");--> statement-breakpoint
CREATE UNIQUE INDEX "softwares_identifier_idx" ON "softwares" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "softwares_name_idx" ON "softwares" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "tickets_channel_idx" ON "tickets" USING btree ("channel_id");--> statement-breakpoint
CREATE INDEX "tickets_discord_user_idx" ON "tickets" USING btree ("discord_user_id");--> statement-breakpoint
CREATE INDEX "tickets_status_idx" ON "tickets" USING btree ("status");