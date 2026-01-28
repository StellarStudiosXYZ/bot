import {
    ButtonInteraction,
    ContainerBuilder,
    TextDisplayBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} from "discord.js";
import { db } from "@/db";
import { products, productSources, softwares } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { buildPaginationRow } from "@/utils/pagination";
import { formatSource } from "@/utils/source";
import { formatPrice } from "@/utils/price";

export async function handleProductsButton(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith("products:")) return;

    await interaction.deferUpdate();

    const [, , pageStr] = interaction.customId.split(":");
    const page = Math.max(1, Number(pageStr) || 1);

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
        .innerJoin(softwares, eq(products.softwareId, softwares.id))
        .orderBy(products.createdAt)
        .limit(1)
        .offset((page - 1) * 1);

    if (!product) return;

    const sources = await db
        .select({
            source: productSources.source,
            link: productSources.link,
            price: productSources.price,
            currency: productSources.currency,
        })
        .from(productSources)
        .where(eq(productSources.productId, product.id));

    const total = await db
        .select({ count: count(products.id) })
        .from(products)
        .then((r) => r[0].count);

    const container = new ContainerBuilder()
        .addTextDisplayComponents((text) =>
            text.setContent(
                "## <:package:1464628193322471578> Browse Products",
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
            new TextDisplayBuilder().setContent("**Get it from**"),
        )
        .addActionRowComponents((row) =>
            row.setComponents(
                sources.map((s) => {
                    const { icon, label } = formatSource(s.source);

                    return new ButtonBuilder()
                        .setEmoji(icon)
                        .setLabel(
                            `${label} - ${formatPrice(s.price, s.currency)}`,
                        )
                        .setURL(s.link)
                        .setStyle(ButtonStyle.Link);
                }),
            ),
        )
        .addTextDisplayComponents((text) =>
            text.setContent(`-# ${page} of ${total} Products`),
        )
        .setAccentColor(0x7040ff);

    const paginationRow = buildPaginationRow(
        "products",
        page,
        Math.ceil(total / 1),
    );

    await interaction.editReply({
        components: [container, paginationRow],
        flags: MessageFlags.IsComponentsV2,
    });
}
