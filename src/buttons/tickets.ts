import {
    ButtonInteraction,
    ContainerBuilder,
    MessageFlags,
    GuildMember,
    ChannelType,
    ButtonBuilder,
    ButtonStyle,
    SectionBuilder,
    time,
    TimestampStyles,
} from "discord.js";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { env } from "@/config/env";
import { errorContainer } from "@/utils/errorContainer";
import { buildTicketCreateModal } from "@/modals/tickets";
import { closeTicket } from "@/services/tickets/closeTicket";
import { buildPaginationRow } from "@/utils/pagination";

export async function handleTicketsButton(interaction: ButtonInteraction) {
    if (interaction.customId === "tickets:create") {
        const modal = buildTicketCreateModal();
        return interaction.showModal(modal);
    }

    if (interaction.customId === "tickets:close") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (
            !interaction.guild ||
            !interaction.channel ||
            interaction.channel.type !== ChannelType.GuildText
        ) {
            return interaction.editReply(
                errorContainer("Invalid ticket channel."),
            );
        }

        const member = interaction.member as GuildMember;
        const channel = interaction.channel;

        const ticket = await db.query.tickets.findFirst({
            where: eq(tickets.channelId, channel.id),
        });

        if (!ticket) {
            return interaction.editReply(
                errorContainer("This channel is not a ticket."),
            );
        }

        const isStaff = member.roles.cache.has(env.SUPPORT_ROLE);

        if (!isStaff && ticket.discordUserId !== interaction.user.id) {
            return interaction.editReply(
                errorContainer(
                    "Only the ticket creator or staff can close this ticket.",
                ),
            );
        }

        if (ticket.status !== "OPEN") {
            return interaction.editReply(
                errorContainer("This ticket cannot be closed."),
            );
        }

        const container = new ContainerBuilder()
            .addTextDisplayComponents((t) =>
                t.setContent(
                    `Are you sure you want to close ticket <#${ticket.channelId}>?`,
                ),
            )
            .addActionRowComponents((row) =>
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`tickets:close_confirm:${ticket.id}`)
                        .setLabel("Yes, close ticket")
                        .setStyle(ButtonStyle.Danger),
                ),
            )
            .setAccentColor(env.ACCENT_COLOR);

        return interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        });
    }

    if (interaction.customId.startsWith("tickets:close_confirm:")) {
        await interaction.deferUpdate();

        const ticketId = interaction.customId.split(":")[2];

        if (
            !interaction.guild ||
            !interaction.channel ||
            interaction.channel.type !== ChannelType.GuildText
        )
            return;

        const ticket = await db.query.tickets.findFirst({
            where: eq(tickets.id, ticketId),
        });

        if (!ticket) return;

        const member = interaction.member as GuildMember;
        const isStaff = member.roles.cache.has(env.SUPPORT_ROLE);

        if (!isStaff && ticket.discordUserId !== interaction.user.id) return;

        await closeTicket({
            guild: interaction.guild,
            channel: interaction.channel,
            ticket: ticket,
            actor: interaction.user,
            client: interaction.client,
        });
    }

    if (interaction.customId.startsWith("tickets:history:")) {
        await interaction.deferUpdate();

        const [, , , pageStr] = interaction.customId.split(":");
        const page = Math.max(1, Number(pageStr) || 1);

        const footer = interaction.message.components
            .flatMap((r: any) => r.components)
            .find((c: any) => c.content?.startsWith("-# User ID:"));

        const userId = footer?.content?.replace("-# User ID:", "").trim();
        if (!userId) return;

        const offset = (page - 1) * 1;

        const total = await db
            .select({ count: count(tickets.id) })
            .from(tickets)
            .where(eq(tickets.discordUserId, userId))
            .then((r) => r[0].count);

        const [ticket] = await db
            .select()
            .from(tickets)
            .where(eq(tickets.discordUserId, userId))
            .orderBy(desc(tickets.createdAt))
            .limit(1)
            .offset(offset);

        if (!ticket) return;

        const container = new ContainerBuilder()
            .setAccentColor(env.ACCENT_COLOR)
            .addSectionComponents(
                new SectionBuilder()
                    .addTextDisplayComponents(
                        (t) =>
                            t.setContent(
                                `## <:mailopen:1467092687042773076> Ticket History`,
                            ),
                        (t) =>
                            t.setContent(
                                `<:channel:1315248776398766161> **Ticket ID**\n\`${ticket.id}\`\n` +
                                    `<:folder:1476101710916354252> **Category**\n\`${ticket.category}\`\n` +
                                    `<:focus:1476101713130815649> **Status**\n\`${ticket.status}\``,
                            ),
                        (t) =>
                            t.setContent(
                                `\`⏱️\` **Created**\n${time(
                                    ticket.createdAt,
                                    TimestampStyles.FullDateShortTime,
                                )}\n` +
                                    (ticket.closedAt
                                        ? `\`🔒\` **Closed**\n${time(
                                              ticket.closedAt,
                                              TimestampStyles.FullDateShortTime,
                                          )}\n`
                                        : "") +
                                    (ticket.status === "OPEN"
                                        ? `<:link:1467155398942396581> **Channel**\n<#${ticket.channelId}>\n`
                                        : "") +
                                    (ticket.transcriptUrl
                                        ? `<:content:1465235859874910269> **Transcript**\n${ticket.transcriptUrl}`
                                        : ""),
                            ),
                    )
                    .setThumbnailAccessory((th) =>
                        th.setURL(
                            interaction.guild?.iconURL() ??
                                interaction.user.displayAvatarURL(),
                        ),
                    ),
            )
            .addTextDisplayComponents((t) =>
                t.setContent(`-# User ID: ${userId}`),
            );

        const paginationRow = buildPaginationRow(
            "tickets:history",
            page,
            Math.ceil(total / 1),
        );

        await interaction.editReply({
            components: [container, paginationRow],
            flags: MessageFlags.IsComponentsV2,
        });
    }
}
