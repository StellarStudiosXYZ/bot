import {
    ModalSubmitInteraction,
    LabelBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalBuilder,
    MessageFlags,
    ContainerBuilder,
    time,
    TimestampStyles,
    SectionBuilder,
} from "discord.js";
import { db } from "@/db";
import { productLicenses, productSources, products } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { sourceXchange } from "@/config/sourcexchange";
import { errorContainer } from "@/utils/errorContainer";
import { logger } from "@/utils/logger";
import { env } from "@/config/env";

export function sourceXchangeModal() {
    const transactionIdLabel = new LabelBuilder()
        .setLabel("Transaction ID")
        .setTextInputComponent(
            new TextInputBuilder()
                .setCustomId("transaction_id")
                .setPlaceholder("Paste your transaction ID here")
                .setStyle(TextInputStyle.Short)
                .setRequired(true),
        );

    return new ModalBuilder()
        .setCustomId("product:link:sourcexchange")
        .setTitle("Link sourceXchange Purchase")
        .addLabelComponents(transactionIdLabel);
}

export async function sourceXchangeModalSubmit(
    interaction: ModalSubmitInteraction,
) {
    if (interaction.customId !== "product:link:sourcexchange") return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const guild = interaction.guild!;
    const logsChannel = guild.channels.cache.get(env.PRODUCT_LINK_LOGS_CHANNEL);
    const transactionId =
        interaction.fields.getTextInputValue("transaction_id");

    try {
        let payment: {
            status: "pending" | "completed";
            remote_id: string;
            product: { id: number };
            user_id: number;
            created_at: string;
        };

        try {
            const res = await sourceXchange.get(`/payments/${transactionId}`);
            payment = res.data;
        } catch {
            logger.warn(
                `[SOURCEXCHANGE_PRODUCT_LINK] Invalid transaction ID: ${transactionId} by user ${interaction.user.username} (${interaction.user.id})`,
            );
            return interaction.editReply(
                errorContainer("Invalid transaction ID."),
            );
        }

        if (payment.status !== "completed") {
            logger.info(
                `[SOURCEXCHANGE_PRODUCT_LINK] Payment not completed transaction ID: ${transactionId} by user ${interaction.user.username} (${interaction.user.id})`,
            );
            return interaction.editReply(
                errorContainer("This payment has not been completed yet."),
            );
        }

        const productSource = await db.query.productSources.findFirst({
            where: and(
                eq(productSources.source, "SOURCEXCHANGE"),
                eq(productSources.sourceProductId, String(payment.product.id)),
            ),
        });

        if (!productSource) {
            logger.warn(
                `[SOURCEXCHANGE_PRODUCT_LINK] Unregistered Product ID: ${payment.product.id} of transaction ID: ${transactionId} by user: ${interaction.user.username} (${interaction.user.id})`,
            );
            return interaction.editReply(
                errorContainer("This product is not registered with us."),
            );
        }

        const product = await db.query.products.findFirst({
            where: eq(products.id, productSource.productId),
        });

        const productDisplay = product
            ? `(\`${product.id}\`) [${product.name}](${productSource.link})`
            : `\`${productSource.productId}\``;

        const globallyLinked = await db.query.productLicenses.findFirst({
            where: and(
                eq(productLicenses.source, "SOURCEXCHANGE"),
                eq(productLicenses.paymentId, String(payment.remote_id)),
            ),
        });

        if (globallyLinked) {
            if (globallyLinked.discordUserId === interaction.user.id) {
                logger.info(
                    `[SOURCEXCHANGE_PRODUCT_LINK] Already linked (same user) | User ${interaction.user.id} | Product ${productSource.productId}`,
                );

                return interaction.editReply(
                    errorContainer(
                        "This purchase is already linked to your account.",
                    ),
                );
            }
            logger.warn(
                `[SOURCEXCHANGE_PRODUCT_LINK] Purchase reuse attempt for Product ID: ${productSource.productId} of transaction ID: ${transactionId} by user: ${interaction.user.username} (${interaction.user.id}) | Existing User ID: ${globallyLinked.discordUserId}`,
            );

            if (logsChannel?.isTextBased()) {
                await logsChannel.send({
                    components: [
                        new ContainerBuilder()
                            .setAccentColor(env.ACCENT_COLOR)
                            .addSectionComponents(
                                new SectionBuilder()
                                    .addTextDisplayComponents(
                                        (t) =>
                                            t.setContent(
                                                `## <:sxc:1291789674687500441> **Reuse Attempt**\n`,
                                            ),
                                        (t) =>
                                            t.setContent(
                                                `<:package:1464628193322471578> **Product**\n${productDisplay}\n` +
                                                    `<:channel:1315248776398766161> **Transaction ID**\n||${transactionId}||\n` +
                                                    `<:member:1315248772527423551> **Existing User**\n<@${globallyLinked.discordUserId}> (\`${globallyLinked.discordUserId}\`)\n` +
                                                    `<:member:1315248772527423551> **Attempted By**\n<@${interaction.user.id}> (\`${interaction.user.id}\`)`,
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
                            ),
                    ],
                    flags: MessageFlags.IsComponentsV2,
                    allowedMentions: { parse: [] },
                });
            }

            return interaction.editReply(
                errorContainer(
                    "This purchase is already linked to another Discord account.",
                ),
            );
        }

        await db.insert(productLicenses).values({
            discordUserId: interaction.user.id,
            sourceUserId: String(payment.user_id),
            productId: productSource.productId,
            source: "SOURCEXCHANGE",
            sourceProductId: String(payment.product.id),
            paymentId: payment.remote_id,
            purchasedAt: new Date(payment.created_at),
        });

        logger.info(
            `[SOURCEXCHANGE_PRODUCT_LINK] Linked Product ID: ${productSource.productId} to user: ${interaction.user.username} (${interaction.user.id}) | Transaction ID: ${transactionId}`,
        );

        if (logsChannel?.isTextBased()) {
            await logsChannel.send({
                components: [
                    new ContainerBuilder()
                        .setAccentColor(env.ACCENT_COLOR)
                        .addSectionComponents(
                            new SectionBuilder()
                                .addTextDisplayComponents(
                                    (t) =>
                                        t.setContent(
                                            `## <:sxc:1291789674687500441> **Product Linked**\n`,
                                        ),
                                    (t) =>
                                        t.setContent(
                                            `<:package:1464628193322471578> **Product**\n${productDisplay}\n` +
                                                `<:channel:1315248776398766161> **Transaction ID**\n||${transactionId}||\n` +
                                                `<:member:1315248772527423551> **User**\n<@${interaction.user.id}> (\`${interaction.user.id}\`) (\`${payment.user_id}\`)\n` +
                                                `<:calender:1467417818843578451> **Purchased at**\n${time(new Date(payment.created_at), TimestampStyles.FullDateShortTime)}`,
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
                        ),
                ],
                flags: MessageFlags.IsComponentsV2,
                allowedMentions: { parse: [] },
            });
        }

        const member = await guild.members.fetch(interaction.user.id);

        if (!member.roles.cache.has(env.CUSTOMER_ROLE)) {
            await member.roles.add(env.CUSTOMER_ROLE);
        }

        if (product?.roleId && !member.roles.cache.has(product.roleId)) {
            await member.roles.add(product.roleId);
        }

        logger.info(
            `[SOURCEXCHANGE_PRODUCT_LINK] Roles granted | User: ${interaction.user.username} (${interaction.user.id}) | Product ${productSource.productId}`,
        );

        const successMessage = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                "### <:link:1467155398942396581> Product Linked Successfully",
                            ),
                        (t) =>
                            t.setContent(
                                "Your purchase has been verified and linked to your account.",
                            ),
                        (t) =>
                            t.setContent(
                                `-# > You have been granted <@&${env.CUSTOMER_ROLE}> and <@&${product?.roleId}> roles.\n` +
                                    `-# > Use </product linked:1464885667040460801> to view all your linked products.`,
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

        return interaction.editReply({
            components: [successMessage],
            flags: MessageFlags.IsComponentsV2,
            allowedMentions: { parse: [] },
        });
    } catch (err) {
        logger.error(
            err,
            `[SOURCEXCHANGE_PRODUCT_LINK] Modal submit failed for user: ${interaction.user.username} (${interaction.user.id})`,
        );

        return interaction.editReply(
            errorContainer("Failed to link product. Please contact support."),
        );
    }
}
