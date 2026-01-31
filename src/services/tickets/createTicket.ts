import {
    ModalSubmitInteraction,
    ChannelType,
    PermissionsBitField,
    ContainerBuilder,
    SectionBuilder,
    MessageFlags,
    AttachmentBuilder,
    FileBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    time,
    TimestampStyles,
} from "discord.js";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { env } from "@/config/env";
import { logger } from "@/utils/logger";
import { errorContainer } from "@/utils/errorContainer";
import { successContainer } from "@/utils/successContainer";

const CATEGORY_LABELS: Record<string, string> = {
    SUPPORT: "Support",
    QUESTION: "Question",
    BUG: "Bug Report",
    OTHER: "Other",
};

export async function createTicket(interaction: ModalSubmitInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const categoryValue =
        interaction.fields.getStringSelectValues("category")[0];
    const categoryLabel = CATEGORY_LABELS[categoryValue] ?? categoryValue;

    const title = interaction.fields.getTextInputValue("title");
    const description = interaction.fields.getTextInputValue("description");

    const existing = await db.query.tickets.findFirst({
        where: and(
            eq(tickets.discordUserId, interaction.user.id),
            eq(tickets.status, "OPEN"),
        ),
    });

    if (existing) {
        return interaction.editReply(
            errorContainer(
                `You already have an open ticket: <#${existing.channelId}>`,
            ),
        );
    }

    const ticketId = randomBytes(4).toString("hex");

    const channel = await interaction.guild!.channels.create({
        name: `ticket-${ticketId}`,
        type: ChannelType.GuildText,
        parent: env.TICKET_CATEGORY,
        permissionOverwrites: [
            {
                id: interaction.guild!.roles.everyone,
                deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            },
            {
                id: env.SUPPORT_ROLE,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            },
            {
                id: env.MODERATOR_ROLE,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                ],
            },
        ],
    });

    await db.insert(tickets).values({
        id: ticketId,
        discordUserId: interaction.user.id,
        channelId: channel.id,
        category: categoryValue,
        status: "OPEN",
    });

    const closeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("tickets:close")
            .setLabel("Close Ticket")
            .setStyle(ButtonStyle.Danger),
    );

    const container = new ContainerBuilder()
        .setAccentColor(env.ACCENT_COLOR)
        .addTextDisplayComponents((t) =>
            t.setContent(`<@&${env.SUPPORT_ROLE}>`),
        )
        .addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(
                    (t) =>
                        t.setContent(
                            `<:channel:1315248776398766161> **Ticket ID**\n\`${ticketId}\`\n` +
                                `<:member:1315248772527423551> **Creator**\n${interaction.user} - \`${interaction.user.id}\``,
                        ),
                    (t) =>
                        t.setContent(
                            `**Category**\n\`${categoryLabel}\`\n` +
                                `**Title**\n${title}\n\n` +
                                `**Description**\n${description}`,
                        ),
                )
                .setThumbnailAccessory((th) =>
                    th.setURL(
                        interaction.guild?.iconURL({ size: 128 }) ??
                            "https://cdn.discordapp.com/embed/avatars/0.png",
                    ),
                ),
        )
        .addActionRowComponents(() => closeRow)
        .addTextDisplayComponents((t) =>
            t.setContent(
                `-# ${time(new Date(), TimestampStyles.FullDateShortTime)}`,
            ),
        );

    const uploadedFiles = interaction.fields.getUploadedFiles("file");

    let attachment: AttachmentBuilder | undefined;
    let fileComponent: FileBuilder | undefined;
    let mediaGallery: any | undefined;

    if (uploadedFiles?.size) {
        const file = uploadedFiles.first()!;

        const isImage =
            file.contentType?.startsWith("image/") ||
            /\.(png|jpe?g|webp|gif)$/i.test(file.name ?? "");

        if (isImage) {
            mediaGallery = {
                type: 12,
                items: [
                    {
                        media: { url: file.url },
                        description: file.name,
                    },
                ],
            };
        } else {
            attachment = new AttachmentBuilder(file.url).setName(
                file.name ?? "attachment",
            );

            fileComponent = new FileBuilder().setURL(
                `attachment://${file.name ?? "attachment"}`,
            );
        }
    }

    const message = await channel.send({
        components: [
            container,
            ...(mediaGallery ? [mediaGallery] : []),
            ...(fileComponent ? [fileComponent] : []),
        ],
        files: attachment ? [attachment] : [],
        flags: MessageFlags.IsComponentsV2,
        allowedMentions: {
            roles: [env.SUPPORT_ROLE],
            users: [interaction.user.id],
        },
    });

    await message.pin();

    logger.info(
        `[TICKET_CREATE] Ticket #${ticketId} (${categoryLabel}) created by ${interaction.user.username} (${interaction.user.id})`,
    );

    return interaction.editReply(
        successContainer(`Your ticket has been created: <#${channel.id}>`),
    );
}
