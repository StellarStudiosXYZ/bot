import {
    ButtonInteraction,
    ContainerBuilder,
    TextDisplayBuilder,
    MessageFlags,
} from "discord.js";
import { db } from "@/db";
import {
    products,
    productSources,
    softwares,
    productLicenses,
} from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { buildPaginationRow } from "@/utils/pagination";

const PAGE_SIZE = 1;

export async function handleLinkedButton(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith("linked:")) return;

    await interaction.deferUpdate();

    const parts = interaction.customId.split(":");
    const page = Math.max(1, Number(parts.at(-1)) || 1);

    const [product] = await db
        .select({
            id: products.id,
            name: products.name,
            summary: products.summary,
            banner: products.banner,
            softwareName: softwares.name,
        })
        .from(products)
        .innerJoin(productLicenses, eq(productLicenses.productId, products.id))
        .innerJoin(softwares, eq(products.softwareId, softwares.id))
        .where(eq(productLicenses.discordUserId, interaction.user.id))
        .orderBy(productLicenses.createdAt)
        .limit(PAGE_SIZE)
        .offset((page - 1) * PAGE_SIZE);

    if (!product) return;

    const total = await db
        .select({ count: count(products.id) })
        .from(products)
        .innerJoin(productLicenses, eq(productLicenses.productId, products.id))
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

    await interaction.editReply({
        components: [
            container,
            buildPaginationRow("linked", page, Math.ceil(total / PAGE_SIZE)),
        ],
        flags: MessageFlags.IsComponentsV2,
    });
}
