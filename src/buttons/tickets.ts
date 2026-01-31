import {
    ButtonInteraction,
    ContainerBuilder,
    MessageFlags,
    GuildMember,
    ChannelType,
    ButtonBuilder,
    ButtonStyle,
} from "discord.js";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { env } from "@/config/env";
import { errorContainer } from "@/utils/errorContainer";
import { buildTicketCreateModal } from "@/modals/tickets";
import { closeTicket } from "@/services/tickets/closeTicket";

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
}
