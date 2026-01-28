import {
    pgTable,
    pgEnum,
    varchar,
    text,
    numeric,
    timestamp,
    uniqueIndex,
    index,
} from "drizzle-orm/pg-core";

export const sourceEnum = pgEnum("source", [
    "SOURCEXCHANGE",
    "BUILTBYBIT",
    "GITHUB",
]);

export const currencyEnum = pgEnum("currency", ["USD", "EUR"]);

export const ticketStatusEnum = pgEnum("ticket_status", ["OPEN", "CLOSED"]);

export const caseActionEnum = pgEnum("case_action", [
    "WARN",
    "TIMEOUT",
    "KICK",
    "BAN",
    "UNBAN",
    "LOCK",
    "UNLOCK",
]);

export const softwares = pgTable(
    "softwares",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        identifier: varchar("identifier", { length: 64 }).notNull(),
        name: varchar("name", { length: 128 }).notNull(),
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
        id: varchar("id", { length: 36 }).primaryKey(),
        softwareId: varchar("software_id", { length: 36 })
            .references(() => softwares.id, { onDelete: "cascade" })
            .notNull(),
        identifier: varchar("identifier", { length: 64 }).notNull(),
        name: varchar("name", { length: 128 }).notNull(),
        version: varchar("version", { length: 32 }).notNull(),
        summary: text("summary").notNull(),
        icon: text("icon").notNull(),
        banner: text("banner").notNull(),
        emoji: text("emoji"),
        roleId: varchar("role_id", { length: 32 }),
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
        id: varchar("id", { length: 36 }).primaryKey(),
        productId: varchar("product_id", { length: 36 })
            .references(() => products.id, { onDelete: "cascade" })
            .notNull(),
        source: sourceEnum("source").notNull(),
        price: numeric("price", { precision: 10, scale: 2 }).notNull(),
        currency: currencyEnum("currency").notNull(),
        link: text("link").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (ps) => [
        uniqueIndex("product_sources_product_source_idx").on(
            ps.productId,
            ps.source,
        ),
    ],
);

export const productChangelogs = pgTable(
    "product_changelogs",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        productId: varchar("product_id", { length: 36 })
            .references(() => products.id, { onDelete: "cascade" })
            .notNull(),
        version: varchar("version", { length: 32 }).notNull(),
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
        id: varchar("id", { length: 36 }).primaryKey(),
        discordUserId: varchar("discord_user_id", { length: 32 }).notNull(),
        productId: varchar("product_id", { length: 36 })
            .references(() => products.id, { onDelete: "cascade" })
            .notNull(),
        productSourceId: varchar("product_source_id", { length: 36 })
            .references(() => productSources.id, { onDelete: "cascade" })
            .notNull(),
        paymentId: varchar("payment_id", { length: 128 }).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (pl) => [
        uniqueIndex("product_licenses_payment_idx").on(pl.paymentId),
        uniqueIndex("product_licenses_user_product_source_idx").on(
            pl.discordUserId,
            pl.productId,
            pl.productSourceId,
        ),
    ],
);

export const tickets = pgTable(
    "tickets",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        discordUserId: varchar("discord_user_id", { length: 32 }).notNull(),
        channelId: varchar("channel_id", { length: 32 }).notNull(),
        category: varchar("category", { length: 32 }).notNull(),
        softwareId: varchar("software_id", { length: 36 }).references(
            () => softwares.id,
            { onDelete: "set null" },
        ),
        productId: varchar("product_id", { length: 36 }).references(
            () => products.id,
            { onDelete: "set null" },
        ),
        status: ticketStatusEnum("status").default("OPEN").notNull(),
        transcriptUrl: text("transcript_url"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        closedAt: timestamp("closed_at"),
    },
    (t) => [
        uniqueIndex("tickets_channel_idx").on(t.channelId),
        index("tickets_discord_user_idx").on(t.discordUserId),
        index("tickets_status_idx").on(t.status),
        index("tickets_software_idx").on(t.softwareId),
    ],
);

export const cases = pgTable(
    "cases",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        action: caseActionEnum("action").notNull(),
        targetUserId: varchar("target_user_id", { length: 32 }).notNull(),
        moderatorUserId: varchar("moderator_user_id", { length: 32 }).notNull(),
        reason: text("reason"),
        duration: numeric("duration"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (c) => [
        index("cases_target_user_idx").on(c.targetUserId),
        index("cases_moderator_user_idx").on(c.moderatorUserId),
        index("cases_action_idx").on(c.action),
    ],
);
