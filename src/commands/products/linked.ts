import {
    SlashCommandSubcommandBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags,
} from "discord.js";
import { db } from "@/db";
import { products, softwares, productLicenses } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { buildPaginationRow } from "@/utils/pagination";
import { errorContainer } from "@/utils/errorContainer";

export const command = {
    data: new SlashCommandSubcommandBuilder()
        .setName("linked")
        .setDescription("List your linked purchases"),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const page = 1;
        const PAGE_SIZE = 1;

        const [product] = await db
            .select({
                id: products.id,
                name: products.name,
                summary: products.summary,
                version: products.version,
                banner: products.banner,
                softwareName: softwares.name,
            })
            .from(products)
            .innerJoin(
                productLicenses,
                eq(productLicenses.productId, products.id),
            )
            .innerJoin(softwares, eq(products.softwareId, softwares.id))
            .where(eq(productLicenses.discordUserId, interaction.user.id))
            .orderBy(productLicenses.createdAt)
            .limit(PAGE_SIZE)
            .offset(0);

        if (!product) {
            return interaction.editReply(
                errorContainer(
                    "You have not linked any purchases yet, use </product link:1464885667040460801> command to link your purchases.",
                ),
            );
        }

        const total = await db
            .select({ count: count(products.id) })
            .from(products)
            .innerJoin(
                productLicenses,
                eq(productLicenses.productId, products.id),
            )
            .where(eq(productLicenses.discordUserId, interaction.user.id))
            .then((r) => r[0].count);

        const container = new ContainerBuilder()
            .addTextDisplayComponents((t) =>
                t.setContent(
                    "## <:package:1464628193322471578> Your Linked Products",
                ),
            )
            .addMediaGalleryComponents((media) =>
                media.addItems((img) =>
                    img.setURL(product.banner).setDescription("banner"),
                ),
            )
            .addSeparatorComponents()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### ${product.name} — ${product.softwareName}`,
                ),
                new TextDisplayBuilder().setContent(`> ${product.summary}`),
            )
            .addTextDisplayComponents((t) =>
                t.setContent(`-# ${page} of ${total} Linked Products`),
            );

        const paginationRow = buildPaginationRow(
            "linked",
            page,
            Math.ceil(total / PAGE_SIZE),
        );

        await interaction.editReply({
            components: [container, paginationRow],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
