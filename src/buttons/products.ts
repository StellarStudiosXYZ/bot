import {
    ButtonInteraction,
    ContainerBuilder,
    TextDisplayBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    SectionBuilder,
    time,
    TimestampStyles,
    MediaGalleryBuilder,
} from "discord.js";
import { db } from "@/db";
import { products, productSources, softwares } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { buildPaginationRow } from "@/utils/pagination";
import { formatSource } from "@/utils/source";
import { formatPrice } from "@/utils/price";
import { env } from "@/config/env";

export async function handleProductsButton(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith("products:")) return;

    const guild = interaction.guild!;
    const [, action, value] = interaction.customId.split(":");

    if (action === "link") {
        if (value === "sourcexchange") {
            const container = new ContainerBuilder()
                .setAccentColor(env.ACCENT_COLOR)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            (t) =>
                                t.setContent(
                                    "### <:sxc:1291789674687500441> Link sourceXchange Purchase",
                                ),
                            (t) =>
                                t.setContent(
                                    "To link one of your purchases, please visit your [accesses](https://www.sourcexchange.net/accesses) and copy the **Transaction ID** of the product you want to link as shown below.",
                                ),
                        )
                        .setThumbnailAccessory((th) =>
                            th.setURL(
                                guild.iconURL() ??
                                    interaction.user.displayAvatarURL(),
                            ),
                        ),
                )
                .addMediaGalleryComponents(
                    new MediaGalleryBuilder().addItems((mediaGalleryItem) =>
                        mediaGalleryItem
                            .setDescription(
                                "Where to find your sourceXchange Transaction ID",
                            )
                            .setURL(
                                "https://cdn.discordapp.com/attachments/1298726101664923648/1467438742129348795/Screenshot_2.png",
                            ),
                    ),
                )
                .addActionRowComponents((row) =>
                    row.addComponents(
                        new ButtonBuilder()
                            .setCustomId("link:sourcexchange")
                            .setLabel("Link Purchase")
                            .setEmoji("<:link:1467155398942396581>")
                            .setStyle(ButtonStyle.Primary),
                    ),
                )
                .addTextDisplayComponents((t) =>
                    t.setContent(
                        `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                    ),
                );

            return interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        if (value === "builtbybit") {
            const container = new ContainerBuilder()
                .setAccentColor(env.ACCENT_COLOR)
                .addSectionComponents(
                    new SectionBuilder()
                        .addTextDisplayComponents(
                            (t) =>
                                t.setContent(
                                    "### <:bbb:1291789674083389531> Link BuiltByBit Products",
                                ),
                            (t) =>
                                t.setContent(
                                    "To link your purchases from BuiltByBit please run </sync:1051865976221733014> command.",
                                ),
                        )
                        .setThumbnailAccessory((th) =>
                            th.setURL(
                                guild.iconURL() ??
                                    interaction.user.displayAvatarURL(),
                            ),
                        ),
                )
                .addTextDisplayComponents((t) =>
                    t.setContent(
                        `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
                    ),
                );

            return interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            });
        }

        return;
    }

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
