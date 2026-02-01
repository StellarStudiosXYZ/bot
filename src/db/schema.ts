import {
    pgTable,
    pgEnum,
    varchar,
    text,
    numeric,
    timestamp,
    uniqueIndex,
    index,
    integer,
} from "drizzle-orm/pg-core";

export const sourceEnum = pgEnum("source", [
    "SOURCEXCHANGE",
    "BUILTBYBIT",
    "GITHUB",
]);

export const currencyEnum = pgEnum("currency", ["USD", "EUR"]);

export const ticketStatusEnum = pgEnum("ticket_status", [
    "OPEN",
    "CLOSING",
    "CLOSED",
]);

export const caseActionEnum = pgEnum("case_action", [
    "WARN",
    "TIMEOUT",
    "KICK",
    "BAN",
    "UNBAN",
]);

export const softwares = pgTable(
    "softwares",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        identifier: varchar("identifier").notNull(),
        name: varchar("name").notNull(),
        icon: text("icon").notNull(),
        emoji: text("emoji").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (s) => [
        uniqueIndex("softwares_identifier_idx").on(s.identifier),
        uniqueIndex("softwares_name_idx").on(s.name),
    ],
);

export const products = pgTable(
    "products",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        softwareId: integer("software_id")
            .references(() => softwares.id, { onDelete: "cascade" })
            .notNull(),
        identifier: varchar("identifier").notNull(),
        name: varchar("name").notNull(),
        version: varchar("version").notNull(),
        summary: text("summary").notNull(),
        icon: text("icon").notNull(),
        banner: text("banner").notNull(),
        emoji: text("emoji"),
        roleId: varchar("role_id"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (p) => [
        uniqueIndex("products_software_identifier_idx").on(
            p.softwareId,
            p.identifier,
        ),
        index("products_software_idx").on(p.softwareId),
    ],
);

export const productSources = pgTable(
    "product_sources",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        productId: integer("product_id")
            .references(() => products.id, { onDelete: "cascade" })
            .notNull(),
        source: sourceEnum("source").notNull(),
        sourceProductId: varchar("source_product_id").notNull(),
        price: numeric("price", { precision: 10, scale: 2 }).notNull(),
        currency: currencyEnum("currency").notNull(),
        link: text("link").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (ps) => [
        uniqueIndex("product_sources_source_pid_idx").on(
            ps.source,
            ps.sourceProductId,
        ),
        uniqueIndex("product_sources_product_source_idx").on(
            ps.productId,
            ps.source,
        ),
        index("product_sources_product_idx").on(ps.productId),
    ],
);

export const productChangelogs = pgTable(
    "product_changelogs",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        productId: integer("product_id")
            .references(() => products.id, { onDelete: "cascade" })
            .notNull(),
        version: varchar("version").notNull(),
        content: text("content").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (pc) => [
        uniqueIndex("product_changelogs_product_version_idx").on(
            pc.productId,
            pc.version,
        ),
        index("product_changelogs_product_idx").on(pc.productId),
    ],
);

export const productLicenses = pgTable(
    "product_licenses",
    {
        id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
        discordUserId: varchar("discord_user_id").notNull(),
        sourceUserId: varchar("source_user_id").notNull(),
        productId: integer("product_id")
            .references(() => products.id, { onDelete: "cascade" })
            .notNull(),
        source: sourceEnum("source").notNull(),
        sourceProductId: varchar("source_product_id").notNull(),
        paymentId: varchar("payment_id").notNull(),
        purchasedAt: timestamp("purchased_at").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (pl) => [
        uniqueIndex("product_licenses_payment_idx").on(pl.paymentId),
        uniqueIndex("product_licenses_user_source_product_idx").on(
            pl.discordUserId,
            pl.source,
            pl.sourceProductId,
        ),
        index("product_licenses_product_idx").on(pl.productId),
        index("product_licenses_source_idx").on(pl.source),
    ],
);

export const tickets = pgTable(
    "tickets",
    {
        id: varchar("id", { length: 8 }).primaryKey(),
        discordUserId: varchar("discord_user_id").notNull(),
        channelId: varchar("channel_id").notNull(),
        category: varchar("category").notNull(),
        status: ticketStatusEnum("status").default("OPEN").notNull(),
        transcriptUrl: text("transcript_url"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        closedAt: timestamp("closed_at"),
    },
    (t) => [
        uniqueIndex("tickets_channel_idx").on(t.channelId),
        index("tickets_discord_user_idx").on(t.discordUserId),
        index("tickets_status_idx").on(t.status),
    ],
);

export const cases = pgTable(
    "cases",
    {
        id: varchar("id", { length: 8 }).primaryKey(),
        action: caseActionEnum("action").notNull(),
        targetUserId: varchar("target_user_id").notNull(),
        moderatorUserId: varchar("moderator_user_id").notNull(),
        reason: text("reason").notNull(),
        attachment: text("attachment"),
        duration: integer("duration"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (c) => [
        index("cases_target_user_idx").on(c.targetUserId),
        index("cases_moderator_user_idx").on(c.moderatorUserId),
        index("cases_action_idx").on(c.action),
    ],
);
